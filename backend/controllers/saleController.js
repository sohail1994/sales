const db = require('../config/database');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

const nextInvoiceNo = async () => {
  const [[{ max }]] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(invoice_no, 5) AS UNSIGNED)) AS max
     FROM sales WHERE invoice_no LIKE 'INV-%'`
  );
  return `INV-${String((max || 0) + 1).padStart(6, '0')}`;
};

exports.getAll = async (req, res) => {
  const { search = '', status, from, to, customer_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  let where = 'WHERE (s.invoice_no LIKE ? OR c.name LIKE ?)';
  const params = [like, like];
  if (status) { where += ' AND s.status=?'; params.push(status); }
  if (customer_id) { where += ' AND s.customer_id=?'; params.push(customer_id); }
  if (from) { where += ' AND s.sale_date >= ?'; params.push(from); }
  if (to) { where += ' AND s.sale_date <= ?'; params.push(to); }

  const [rows] = await db.query(
    `SELECT s.*, c.name AS customer_name, c.phone AS customer_phone
     FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
     ${where} ORDER BY s.sale_date DESC, s.id DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM sales s LEFT JOIN customers c ON c.id=s.customer_id ${where}`,
    params
  );
  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
            c.address AS customer_address
     FROM sales s LEFT JOIN customers c ON c.id=s.customer_id WHERE s.id=?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Sale not found' });

  const [items] = await db.query(
    `SELECT si.*, p.name AS product_name, p.barcode
     FROM sale_items si LEFT JOIN products p ON p.id=si.product_id
     WHERE si.sale_id=?`,
    [req.params.id]
  );
  res.json({ ...rows[0], items });
};

exports.create = async (req, res) => {
  const { customer_id, sale_date, items, discount = 0, tax = 0,
          other_charges = 0, paid_amount = 0, payment_method, notes } = req.body;

  if (!items || !items.length) return res.status(400).json({ message: 'At least one item required' });

  // Stock availability check
  for (const item of items) {
    const [[product]] = await db.query('SELECT name, stock_qty FROM products WHERE id=?', [item.product_id]);
    if (!product) return res.status(400).json({ message: `Product ID ${item.product_id} not found` });
    if (Number(product.stock_qty) < Number(item.quantity)) {
      return res.status(400).json({
        message: `Insufficient stock for "${product.name}". Available: ${product.stock_qty}, Requested: ${item.quantity}`
      });
    }
  }

  const invoice_no = await nextInvoiceNo();
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price - (i.discount || 0), 0);
  const total_amount = subtotal - Number(discount) + Number(tax) + Number(other_charges);
  const due_amount = total_amount - Number(paid_amount);
  const status = due_amount <= 0 ? 'paid' : Number(paid_amount) > 0 ? 'partial' : 'pending';

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const [sRes] = await conn.query(
      `INSERT INTO sales (customer_id,user_id,invoice_no,sale_date,subtotal,discount,tax,other_charges,
       total_amount,paid_amount,due_amount,payment_method,status,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [customer_id || null, req.user.id, invoice_no, sale_date,
       subtotal, discount, tax, other_charges, total_amount, paid_amount, due_amount,
       payment_method || 'cash', status, notes]
    );
    const saleId = sRes.insertId;

    for (const item of items) {
      const total_price = item.quantity * item.unit_price - (item.discount || 0);
      await conn.query(
        'INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,discount,total_price) VALUES (?,?,?,?,?,?)',
        [saleId, item.product_id, item.quantity, item.unit_price, item.discount || 0, total_price]
      );
      await conn.query('UPDATE products SET stock_qty = stock_qty - ? WHERE id=?',
        [item.quantity, item.product_id]);
    }

    // Update customer balance if credit
    if (customer_id && due_amount > 0) {
      await conn.query('UPDATE customers SET balance = balance + ? WHERE id=?', [due_amount, customer_id]);
    }

    await conn.commit();
    res.status(201).json({ id: saleId, invoice_no, message: 'Sale created' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.addPayment = async (req, res) => {
  const { amount, payment_method, payment_date, notes } = req.body;
  const [rows] = await db.query('SELECT * FROM sales WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Sale not found' });

  const s = rows[0];
  const newPaid = Number(s.paid_amount) + Number(amount);
  const newDue = Number(s.total_amount) - newPaid;
  const status = newDue <= 0 ? 'paid' : 'partial';

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query('UPDATE sales SET paid_amount=?,due_amount=?,status=? WHERE id=?',
      [newPaid, Math.max(0, newDue), status, req.params.id]);
    await conn.query(
      'INSERT INTO payments (reference_id,reference_type,amount,payment_method,payment_date,notes) VALUES (?,?,?,?,?,?)',
      [req.params.id, 'sale', amount, payment_method || 'cash', payment_date, notes]
    );
    if (s.customer_id) {
      await conn.query('UPDATE customers SET balance = balance - ? WHERE id=?', [amount, s.customer_id]);
    }
    await conn.commit();
    res.json({ message: 'Payment recorded' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.getInvoicePDF = async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, c.name AS customer_name, c.phone AS customer_phone,
            c.email AS customer_email, c.address AS customer_address
     FROM sales s LEFT JOIN customers c ON c.id=s.customer_id WHERE s.id=?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Sale not found' });

  const [items] = await db.query(
    `SELECT si.*, p.name AS product_name FROM sale_items si
     LEFT JOIN products p ON p.id=si.product_id WHERE si.sale_id=?`,
    [req.params.id]
  );

  const sale = { ...rows[0], items };
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${sale.invoice_no}.pdf"`);
  generateInvoicePDF(sale, res);
};

exports.cancelSale = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM sales WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Sale not found' });

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const [items] = await conn.query('SELECT * FROM sale_items WHERE sale_id=?', [req.params.id]);
    for (const item of items) {
      await conn.query('UPDATE products SET stock_qty = stock_qty + ? WHERE id=?',
        [item.quantity, item.product_id]);
    }
    await conn.query('UPDATE sales SET status=? WHERE id=?', ['cancelled', req.params.id]);
    await conn.commit();
    res.json({ message: 'Sale cancelled and stock restored' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};
