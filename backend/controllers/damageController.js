const db = require('../config/database');

exports.getAll = async (req, res) => {
  const { search = '', from, to, reason, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  let where = 'WHERE (p.name LIKE ? OR d.reason LIKE ?)';
  const params = [like, like];
  if (from)   { where += ' AND d.damage_date >= ?'; params.push(from); }
  if (to)     { where += ' AND d.damage_date <= ?'; params.push(to); }
  if (reason) { where += ' AND d.reason = ?'; params.push(reason); }

  const [rows] = await db.query(
    `SELECT d.*, p.name AS product_name, p.unit, p.barcode,
            c.name AS category_name, u.name AS recorded_by
     FROM damage_records d
     LEFT JOIN products p ON p.id = d.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN users u ON u.id = d.user_id
     ${where}
     ORDER BY d.damage_date DESC, d.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM damage_records d
     LEFT JOIN products p ON p.id = d.product_id ${where}`,
    params
  );
  const [[summary]] = await db.query(
    `SELECT COALESCE(SUM(d.quantity),0) AS total_qty,
            COALESCE(SUM(d.total_loss),0) AS total_loss
     FROM damage_records d
     LEFT JOIN products p ON p.id = d.product_id ${where}`,
    params
  );
  res.json({ data: rows, total, page: Number(page), limit: Number(limit), summary });
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.*, p.name AS product_name, p.unit, p.barcode, u.name AS recorded_by
     FROM damage_records d
     LEFT JOIN products p ON p.id = d.product_id
     LEFT JOIN users u ON u.id = d.user_id
     WHERE d.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Record not found' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { product_id, damage_date, quantity, reason, notes } = req.body;

  if (!product_id || !quantity || Number(quantity) <= 0) {
    return res.status(400).json({ message: 'Product and quantity are required' });
  }

  const [[product]] = await db.query(
    'SELECT name, stock_qty, purchase_price FROM products WHERE id = ?',
    [product_id]
  );
  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (Number(product.stock_qty) < Number(quantity)) {
    return res.status(400).json({
      message: `Insufficient stock. Available: ${product.stock_qty}, Requested: ${quantity}`
    });
  }

  const unit_cost  = Number(product.purchase_price);
  const total_loss = unit_cost * Number(quantity);

  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const [result] = await conn.query(
      `INSERT INTO damage_records (product_id, user_id, damage_date, quantity, unit_cost, total_loss, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, req.user.id, damage_date, quantity, unit_cost, total_loss, reason || 'damaged', notes || null]
    );
    // Deduct from stock
    await conn.query(
      'UPDATE products SET stock_qty = GREATEST(0, stock_qty - ?) WHERE id = ?',
      [quantity, product_id]
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId, message: 'Damage recorded successfully' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM damage_records WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Record not found' });

  const record = rows[0];
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    // Restore stock on delete
    await conn.query(
      'UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?',
      [record.quantity, record.product_id]
    );
    await conn.query('DELETE FROM damage_records WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ message: 'Damage record deleted and stock restored' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.getReport = async (req, res) => {
  const { from, to } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (from) { where += ' AND d.damage_date >= ?'; params.push(from); }
  if (to)   { where += ' AND d.damage_date <= ?'; params.push(to); }

  const [byReason] = await db.query(
    `SELECT d.reason, COUNT(*) AS count,
            SUM(d.quantity) AS total_qty, SUM(d.total_loss) AS total_loss
     FROM damage_records d ${where}
     GROUP BY d.reason ORDER BY total_loss DESC`,
    params
  );
  const [byProduct] = await db.query(
    `SELECT p.name AS product_name, p.unit,
            SUM(d.quantity) AS total_qty, SUM(d.total_loss) AS total_loss
     FROM damage_records d
     LEFT JOIN products p ON p.id = d.product_id
     ${where}
     GROUP BY d.product_id ORDER BY total_loss DESC LIMIT 10`,
    params
  );
  const [[totals]] = await db.query(
    `SELECT COALESCE(SUM(quantity),0) AS total_qty,
            COALESCE(SUM(total_loss),0) AS total_loss
     FROM damage_records d ${where}`,
    params
  );
  res.json({ by_reason: byReason, by_product: byProduct, totals });
};
