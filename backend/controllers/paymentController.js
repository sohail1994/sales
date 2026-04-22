const db = require('../config/database');

exports.getAll = async (req, res) => {
  const { reference_type, from, to, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = 'WHERE 1=1';
  const params = [];
  if (reference_type) { where += ' AND reference_type=?'; params.push(reference_type); }
  if (from) { where += ' AND payment_date>=?'; params.push(from); }
  if (to)   { where += ' AND payment_date<=?'; params.push(to); }

  const [rows] = await db.query(
    `SELECT * FROM payments ${where}
     ORDER BY payment_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM payments ${where}`, params
  );
  res.json({ data: rows, total });
};

// ── Reminders ────────────────────────────────────────────────
exports.getReminders = async (req, res) => {
  const { status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND pr.status=?'; params.push(status); }

  const [rows] = await db.query(
    `SELECT pr.*, c.name AS customer_name, c.phone AS customer_phone,
            s.invoice_no
     FROM payment_reminders pr
     LEFT JOIN customers c ON c.id=pr.customer_id
     LEFT JOIN sales s ON s.id=pr.sale_id
     ${where} ORDER BY pr.due_date ASC`,
    params
  );
  res.json(rows);
};

exports.createReminder = async (req, res) => {
  const { customer_id, sale_id, amount, due_date, message } = req.body;
  const [result] = await db.query(
    'INSERT INTO payment_reminders (customer_id,sale_id,amount,due_date,message) VALUES (?,?,?,?,?)',
    [customer_id, sale_id || null, amount, due_date, message]
  );
  res.status(201).json({ id: result.insertId, message: 'Reminder created' });
};

exports.updateReminder = async (req, res) => {
  const { status, message } = req.body;
  await db.query('UPDATE payment_reminders SET status=?,message=? WHERE id=?',
    [status, message, req.params.id]);
  res.json({ message: 'Reminder updated' });
};

exports.deleteReminder = async (req, res) => {
  await db.query('DELETE FROM payment_reminders WHERE id=?', [req.params.id]);
  res.json({ message: 'Reminder deleted' });
};
