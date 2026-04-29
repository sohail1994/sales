const db = require('../config/database');

// GET /api/products/:productId/sale-units
exports.getByProduct = async (req, res) => {
  const [rows] = await db.query(
    `SELECT * FROM product_sale_units
     WHERE product_id = ? AND is_active = 1
     ORDER BY qty_in_base_unit ASC`,
    [req.params.productId]
  );
  res.json(rows);
};

// POST /api/products/:productId/sale-units
exports.create = async (req, res) => {
  const { label, qty_in_base_unit, sale_price, is_default } = req.body;
  const productId = req.params.productId;

  if (!label || !qty_in_base_unit || !sale_price) {
    return res.status(400).json({ message: 'label, qty_in_base_unit and sale_price are required' });
  }

  if (is_default) {
    await db.query(
      'UPDATE product_sale_units SET is_default = 0 WHERE product_id = ?',
      [productId]
    );
  }

  const [result] = await db.query(
    `INSERT INTO product_sale_units (product_id, label, qty_in_base_unit, sale_price, is_default)
     VALUES (?, ?, ?, ?, ?)`,
    [productId, label, qty_in_base_unit, sale_price, is_default ? 1 : 0]
  );
  res.status(201).json({ id: result.insertId, message: 'Sale unit created' });
};

// PUT /api/products/:productId/sale-units/:id
exports.update = async (req, res) => {
  const { label, qty_in_base_unit, sale_price, is_default } = req.body;

  const [rows] = await db.query(
    'SELECT product_id FROM product_sale_units WHERE id = ? AND is_active = 1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Sale unit not found' });

  if (is_default) {
    await db.query(
      'UPDATE product_sale_units SET is_default = 0 WHERE product_id = ?',
      [rows[0].product_id]
    );
  }

  await db.query(
    `UPDATE product_sale_units
     SET label = ?, qty_in_base_unit = ?, sale_price = ?, is_default = ?
     WHERE id = ?`,
    [label, qty_in_base_unit, sale_price, is_default ? 1 : 0, req.params.id]
  );
  res.json({ message: 'Sale unit updated' });
};

// DELETE /api/products/:productId/sale-units/:id
exports.remove = async (req, res) => {
  await db.query(
    'UPDATE product_sale_units SET is_active = 0 WHERE id = ?',
    [req.params.id]
  );
  res.json({ message: 'Sale unit removed' });
};
