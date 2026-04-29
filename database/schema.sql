-- ============================================================
-- Shop Management System - Database Schema
-- ============================================================
CREATE DATABASE IF NOT EXISTS shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shop_db;

-- Users / Staff
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'cashier') DEFAULT 'cashier',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  image VARCHAR(255),
  credit_limit DECIMAL(12,2) DEFAULT 0.00,
  balance DECIMAL(12,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  supplier_id INT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  barcode VARCHAR(100) UNIQUE,
  sku VARCHAR(100) UNIQUE,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  avg_cost DECIMAL(12,2) DEFAULT 0.00,
  stock_qty DECIMAL(12,2) DEFAULT 0.00,
  min_stock DECIMAL(12,2) DEFAULT 5.00,
  unit VARCHAR(50) DEFAULT 'pcs',
  image VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Purchases (Buy from supplier)
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  user_id INT,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  purchase_date DATE NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  discount DECIMAL(12,2) DEFAULT 0.00,
  tax DECIMAL(12,2) DEFAULT 0.00,
  other_charges DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  paid_amount DECIMAL(12,2) DEFAULT 0.00,
  due_amount DECIMAL(12,2) DEFAULT 0.00,
  payment_method ENUM('cash','card','bank_transfer','credit') DEFAULT 'cash',
  status ENUM('pending','partial','paid') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  user_id INT,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  sale_date DATE NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0.00,
  discount DECIMAL(12,2) DEFAULT 0.00,
  tax DECIMAL(12,2) DEFAULT 0.00,
  other_charges DECIMAL(12,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  paid_amount DECIMAL(12,2) DEFAULT 0.00,
  due_amount DECIMAL(12,2) DEFAULT 0.00,
  payment_method ENUM('cash','card','bank_transfer','credit') DEFAULT 'cash',
  status ENUM('pending','partial','paid','cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0.00,
  total_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0.00,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Payments (manual payments against sale/purchase)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_id INT NOT NULL,
  reference_type ENUM('sale','purchase') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash','card','bank_transfer') DEFAULT 'cash',
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Reminders
CREATE TABLE IF NOT EXISTS payment_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  sale_id INT,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending','sent','paid') DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Damage Records
CREATE TABLE IF NOT EXISTS damage_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT,
  damage_date DATE NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_loss DECIMAL(12,2) NOT NULL,
  reason ENUM('damaged','expired','stolen','lost','other') DEFAULT 'damaged',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Stock Batches (one row per purchase line, tracks remaining qty per batch for FIFO)
CREATE TABLE IF NOT EXISTS stock_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  purchase_id INT NOT NULL,
  purchase_item_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  qty_received DECIMAL(12,2) NOT NULL,
  qty_remaining DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_item_id) REFERENCES purchase_items(id) ON DELETE CASCADE
);

-- Sale Items Batches (links each sale item to exact batch(es) consumed via FIFO)
CREATE TABLE IF NOT EXISTS sale_items_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_item_id INT NOT NULL,
  batch_id INT NOT NULL,
  qty_taken DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items(id) ON DELETE CASCADE,
  FOREIGN KEY (batch_id) REFERENCES stock_batches(id) ON DELETE CASCADE
);

-- Product Sale Units (sell by fractional weight/volume, e.g. 100g, 200g, 500g from 1 kg base)
CREATE TABLE IF NOT EXISTS product_sale_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  label VARCHAR(100) NOT NULL,              -- e.g. "100g", "Half KG", "200ml"
  qty_in_base_unit DECIMAL(12,4) NOT NULL, -- e.g. 0.1 means 100g when base unit is kg
  sale_price DECIMAL(12,2) NOT NULL,        -- price for this pack size
  is_default TINYINT(1) DEFAULT 0,          -- pre-selected in sale form
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- Migration helpers (run these on existing databases only)
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_cost DECIMAL(12,2) DEFAULT 0.00;
-- ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) DEFAULT 0.00;
-- ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS sale_unit_id INT NULL;
-- ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS sale_unit_label VARCHAR(100) NULL;
-- ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS sale_unit_factor DECIMAL(12,4) NULL;
-- ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS base_qty_deducted DECIMAL(12,4) NULL;
-- ============================================================

-- ============================================================
-- Default Data
-- ============================================================

-- Default admin user  (password: Admin@123)
INSERT IGNORE INTO users (name, email, password, role, is_active) VALUES
  ('Administrator', 'admin@shop.com', '$2a$10$KbRW3UBhF26ks5Re/GX4d.rpEXfetiPFzEeKLsLW5SbD7pYLD7Py2', 'admin', 1);

INSERT IGNORE INTO categories (name, description) VALUES
  ('Electronics', 'Electronic gadgets and devices'),
  ('Clothing', 'Clothes and apparel'),
  ('Food & Beverages', 'Food items and drinks'),
  ('Home & Garden', 'Home and garden supplies'),
  ('Sports & Fitness', 'Sports and fitness equipment');
