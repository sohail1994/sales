const db = require('../config/database');

const nextInvoiceNo = async (prefix) => {
  const [[{ max }]] = await db.query(
    `SELECT MAX(CAST(SUBSTRING(invoice_no, ${prefix.length + 1}) AS UNSIGNED)) AS max
     FROM ${prefix === 'PUR-' ? 'purchases' : 'sales'}
     WHERE invoice_no LIKE '${prefix}%'`
  );
  return `${prefix}${String((max || 0) + 1).padStart(6, '0')}`;
};

exports.getAll = async (req, res) => {
  const { search = '', status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  let where = 'WHERE (p.invoice_no LIKE ? OR s.name LIKE ?)';
  const params = [like, like];
  if (status) { where += ' AND p.status=?'; params.push(status); }

  const [rows] = await db.query(
    `SELECT p.*, s.name AS supplier_name FROM purchases p
     LEFT JOIN suppliers s ON s.id=p.supplier_id
     ${where} ORDER BY p.purchase_date DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id ${where}`,
    params
  );
  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, s.name AS supplier_name FROM purchases p
     LEFT JOIN suppliers s ON s.id=p.supplier_id WHERE p.id=?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Purchase not found' });

  const [items] = await db.query(
    `SELECT pi.*, pr.name AS product_name, pr.barcode
     FROM purchase_items pi
     LEFT JOIN products pr ON pr.id=pi.product_id
     WHERE pi.purchase_id=?`,
    [req.params.id]
  );
  res.json({ ...rows[0], items });
};

exports.create = async (req, res) => {
  const { supplier_id, purchase_date, items, discount = 0, tax = 0,
          other_charges = 0, paid_amount = 0, payment_method, notes, status } = req.body;

  if (!items || !items.length) return res.status(400).json({ message: 'At least one item required' });

  const invoice_no = await nextInvoiceNo('PUR-');
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total_amount = subtotal - Number(discount) + Number(tax) + Number(other_charges);
  const due_amount = total_amount - Number(paid_amount);
  const st = due_amount <= 0 ? 'paid' : Number(paid_amount) > 0 ? 'partial' : 'pending';

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const [pRes] = await conn.query(
      `INSERT INTO purchases (supplier_id,user_id,invoice_no,purchase_date,subtotal,discount,
       tax,other_charges,total_amount,paid_amount,due_amount,payment_method,status,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [supplier_id || null, req.user.id, invoice_no, purchase_date,
       subtotal, discount, tax, other_charges, total_amount, paid_amount, due_amount,
       payment_method || 'cash', status || st, notes]
    );
    const purchaseId = pRes.insertId;

    for (const item of items) {
      const total_price = item.quantity * item.unit_price;
      await conn.query(
        'INSERT INTO purchase_items (purchase_id,product_id,quantity,unit_price,total_price) VALUES (?,?,?,?,?)',
        [purchaseId, item.product_id, item.quantity, item.unit_price, total_price]
      );
      // Update stock
      await conn.query('UPDATE products SET stock_qty = stock_qty + ? WHERE id=?',
        [item.quantity, item.product_id]);
    }

    await conn.commit();
    res.status(201).json({ id: purchaseId, invoice_no, message: 'Purchase created' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.addPayment = async (req, res) => {
  const { amount, payment_method, payment_date, notes } = req.body;
  const [rows] = await db.query('SELECT * FROM purchases WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Purchase not found' });

  const p = rows[0];
  const newPaid = Number(p.paid_amount) + Number(amount);
  const newDue = Number(p.total_amount) - newPaid;
  const status = newDue <= 0 ? 'paid' : 'partial';

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query('UPDATE purchases SET paid_amount=?,due_amount=?,status=? WHERE id=?',
      [newPaid, Math.max(0, newDue), status, req.params.id]);
    await conn.query(
      'INSERT INTO payments (reference_id,reference_type,amount,payment_method,payment_date,notes) VALUES (?,?,?,?,?,?)',
      [req.params.id, 'purchase', amount, payment_method || 'cash', payment_date, notes]
    );
    await conn.commit();
    res.json({ message: 'Payment recorded' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};
