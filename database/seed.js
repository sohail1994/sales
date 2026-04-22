/**
 * seed.js – run once to create the default admin user
 * Usage: node database/seed.js
 *    OR: cd backend && node ../database/seed.js
 */
// Resolve modules from backend folder (where npm install was run)
const Module = require('module');
const path = require('path');
Module._nodeModulePaths = (from) => [path.join(__dirname, '../backend/node_modules')];

const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const mysql  = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'shop_db',
  });

  const hash = await bcrypt.hash('admin123', 10);

  await conn.execute(
    `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
    ['Administrator', 'admin@shop.com', hash, 'admin']
  );

  console.log('✅  Admin user created — email: admin@shop.com  password: admin123');
  await conn.end();
})();
