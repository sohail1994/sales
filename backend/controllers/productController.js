const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { generateBarcodeImage } = require('../utils/barcodeGenerator');
const { v4: uuidv4 } = require('uuid');

exports.getAll = async (req, res) => {
  const { search = '', category_id, page = 1, limit = 20, low_stock } = req.query;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;

  let where = 'WHERE (p.name LIKE ? OR p.barcode LIKE ? OR p.sku LIKE ?)';
  const params = [like, like, like];

  if (category_id) { where += ' AND p.category_id=?'; params.push(category_id); }
  if (low_stock === 'true') { where += ' AND p.stock_qty <= p.min_stock'; }

  const [rows] = await db.query(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     ${where} AND p.is_active=1
     ORDER BY p.name LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM products p ${where} AND p.is_active=1`,
    params
  );
  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
};

exports.getOne = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, c.name AS category_name, s.name AS supplier_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.id=?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Product not found' });
  res.json(rows[0]);
};

exports.getByBarcode = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.barcode=? AND p.is_active=1`,
    [req.params.barcode]
  );
  if (!rows.length) return res.status(404).json({ message: 'Product not found' });
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { name, description, category_id, supplier_id, purchase_price,
          sale_price, stock_qty, min_stock, unit, barcode: bc, sku } = req.body;

  const barcode = bc || uuidv4().replace(/-/g, '').substring(0, 13);
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const [result] = await db.query(
    `INSERT INTO products
     (name,description,category_id,supplier_id,purchase_price,sale_price,
      stock_qty,min_stock,unit,barcode,sku,image)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [name, description, category_id || null, supplier_id || null,
     purchase_price, sale_price, 0, min_stock || 5, unit || 'pcs',
     barcode, sku || null, image]
  );
  res.status(201).json({ id: result.insertId, barcode, message: 'Product created' });
};

exports.update = async (req, res) => {
  const { name, description, category_id, supplier_id, purchase_price,
          sale_price, min_stock, unit, barcode, sku } = req.body;

  const [existing] = await db.query('SELECT image FROM products WHERE id=?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ message: 'Product not found' });

  let image = existing[0].image;
  if (req.file) {
    if (image) {
      const old = path.join(__dirname, '..', image);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    image = `/uploads/${req.file.filename}`;
  }
  await db.query(
    `UPDATE products SET name=?,description=?,category_id=?,supplier_id=?,
     purchase_price=?,sale_price=?,min_stock=?,unit=?,barcode=?,sku=?,image=? WHERE id=?`,
    [name, description, category_id || null, supplier_id || null,
     purchase_price, sale_price, min_stock || 5, unit, barcode, sku || null,
     image, req.params.id]
  );
  res.json({ message: 'Product updated' });
};

exports.remove = async (req, res) => {
  await db.query('UPDATE products SET is_active=0 WHERE id=?', [req.params.id]);
  res.json({ message: 'Product deleted' });
};

exports.getBarcodeImage = async (req, res) => {
  try {
    const png = await generateBarcodeImage(req.params.barcode);
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
