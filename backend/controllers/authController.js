const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

exports.profile = async (req, res) => {
  const [rows] = await db.query('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(rows[0]);
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const [rows] = await db.query('SELECT password FROM users WHERE id=?', [req.user.id]);
  const match = await bcrypt.compare(currentPassword, rows[0].password);
  if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
  res.json({ message: 'Password changed successfully' });
};

exports.getUsers = async (req, res) => {
  const [rows] = await db.query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY name');
  res.json(rows);
};

exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
    [name, email, hash, role || 'cashier']
  );
  res.status(201).json({ id: result.insertId, message: 'User created' });
};

exports.updateUser = async (req, res) => {
  const { name, email, role, is_active } = req.body;
  await db.query('UPDATE users SET name=?,email=?,role=?,is_active=? WHERE id=?',
    [name, email, role, is_active, req.params.id]);
  res.json({ message: 'User updated' });
};
