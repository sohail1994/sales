const db = require('../config/database');

exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
};

exports.create = async (req, res) => {
  const { name, description } = req.body;
  const [result] = await db.query('INSERT INTO categories (name,description) VALUES (?,?)', [name, description]);
  res.status(201).json({ id: result.insertId, message: 'Category created' });
};

exports.update = async (req, res) => {
  const { name, description } = req.body;
  await db.query('UPDATE categories SET name=?,description=? WHERE id=?', [name, description, req.params.id]);
  res.json({ message: 'Category updated' });
};

exports.remove = async (req, res) => {
  await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ message: 'Category deleted' });
};
