const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/purchases',  require('./routes/purchases'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/inventory',  require('./routes/inventory'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/damages',    require('./routes/damages'));
app.use('/api/reports',    require('./routes/reports'));

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
