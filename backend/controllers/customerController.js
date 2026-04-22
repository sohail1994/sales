const db = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getAll = async (req, res) => {
  const { search = '', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  const [rows] = await db.query(
    `SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
     ORDER BY name LIMIT ? OFFSET ?`,
    [like, like, like, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?`,
    [like, like, like]
  );
  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM customers WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Customer not found' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { name, phone, email, address, credit_limit, notes } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await db.query(
    `INSERT INTO customers (name,phone,email,address,image,credit_limit,notes)
     VALUES (?,?,?,?,?,?,?)`,
    [name, phone, email, address, image, credit_limit || 0, notes]
  );
  res.status(201).json({ id: result.insertId, message: 'Customer created' });
};

exports.update = async (req, res) => {
  const { name, phone, email, address, credit_limit, notes } = req.body;
  const [existing] = await db.query('SELECT image FROM customers WHERE id=?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Customer not found' });

  let image = existing[0].image;
  if (req.file) {
    if (image) {
      const old = path.join(__dirname, '..', image);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    image = `/uploads/${req.file.filename}`;
  }
  await db.query(
    `UPDATE customers SET name=?,phone=?,email=?,address=?,image=?,credit_limit=?,notes=? WHERE id=?`,
    [name, phone, email, address, image, credit_limit || 0, notes, req.params.id]
  );
  res.json({ message: 'Customer updated' });
};

exports.remove = async (req, res) => {
  const [rows] = await db.query('SELECT image FROM customers WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Customer not found' });
  if (rows[0].image) {
    const p = path.join(__dirname, '..', rows[0].image);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
  res.json({ message: 'Customer deleted' });
};

exports.getLedger = async (req, res) => {
  const { id } = req.params;
  const [sales] = await db.query(
    `SELECT id, invoice_no, sale_date AS date, total_amount, paid_amount, due_amount, status
     FROM sales WHERE customer_id=? ORDER BY sale_date DESC`,
    [id]
  );
  res.json(sales);
};
