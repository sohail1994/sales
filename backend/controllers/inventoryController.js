const db = require('../config/database');

exports.getStock = async (req, res) => {
  const { search = '', category_id, low_stock, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  let where = 'WHERE p.is_active=1 AND (p.name LIKE ? OR p.barcode LIKE ?)';
  const params = [like, like];
  if (category_id) { where += ' AND p.category_id=?'; params.push(category_id); }
  if (low_stock === 'true') { where += ' AND p.stock_qty <= p.min_stock'; }

  const [rows] = await db.query(
    `SELECT p.id, p.name, p.barcode, p.sku, p.stock_qty, p.min_stock, p.unit,
            p.purchase_price, p.sale_price, p.image,
            c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     ${where} ORDER BY p.name LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM products p ${where}`, params
  );
  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
};

exports.adjustStock = async (req, res) => {
  const { product_id, quantity, type, notes } = req.body;
  // type: 'remove' | 'set'  ('add' is blocked — use Purchase to add stock)
  if (type === 'add') {
    return res.status(400).json({ message: 'Use a Purchase order to add stock. Manual add is not allowed.' });
  } else if (type === 'set') {
    await db.query('UPDATE products SET stock_qty=? WHERE id=?', [quantity, product_id]);
  } else if (type === 'add') {
    await db.query('UPDATE products SET stock_qty = stock_qty + ? WHERE id=?', [quantity, product_id]);
  } else if (type === 'remove') {
    await db.query('UPDATE products SET stock_qty = GREATEST(0, stock_qty - ?) WHERE id=?', [quantity, product_id]);
  }
  res.json({ message: 'Stock adjusted' });
};

exports.getLowStock = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.is_active=1 AND p.stock_qty <= p.min_stock ORDER BY p.stock_qty ASC`
  );
  res.json(rows);
};

exports.getStockValue = async (req, res) => {
  const [[row]] = await db.query(
    `SELECT
       COUNT(*) AS total_products,
       SUM(stock_qty) AS total_units,
       SUM(stock_qty * purchase_price) AS total_purchase_value,
       SUM(stock_qty * sale_price) AS total_sale_value
     FROM products WHERE is_active=1`
  );
  res.json(row);
};
