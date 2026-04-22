const db = require('../config/database');

exports.getAll = async (req, res) => {
  const { search = '' } = req.query;
  const like = `%${search}%`;
  const [rows] = await db.query(
    'SELECT * FROM suppliers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name',
    [like, like, like]
  );
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM suppliers WHERE id=?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Supplier not found' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { name, phone, email, address } = req.body;
  const [result] = await db.query(
    'INSERT INTO suppliers (name,phone,email,address) VALUES (?,?,?,?)',
    [name, phone, email, address]
  );
  res.status(201).json({ id: result.insertId, message: 'Supplier created' });
};

exports.update = async (req, res) => {
  const { name, phone, email, address } = req.body;
  await db.query('UPDATE suppliers SET name=?,phone=?,email=?,address=? WHERE id=?',
    [name, phone, email, address, req.params.id]);
  res.json({ message: 'Supplier updated' });
};

exports.remove = async (req, res) => {
  await db.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
  res.json({ message: 'Supplier deleted' });
};
