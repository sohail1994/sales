const db = require('../config/database');

exports.getDashboard = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.substring(0, 7) + '-01';

  const [[todaySales]]  = await db.query(`SELECT COALESCE(SUM(total_amount),0) AS val FROM sales WHERE sale_date=? AND status!='cancelled'`, [today]);
  const [[monthSales]]  = await db.query(`SELECT COALESCE(SUM(total_amount),0) AS val FROM sales WHERE sale_date>=? AND status!='cancelled'`, [firstOfMonth]);
  const [[todayPurch]]  = await db.query(`SELECT COALESCE(SUM(total_amount),0) AS val FROM purchases WHERE purchase_date=?`, [today]);
  const [[monthPurch]]  = await db.query(`SELECT COALESCE(SUM(total_amount),0) AS val FROM purchases WHERE purchase_date>=?`, [firstOfMonth]);
  const [[totalDue]]    = await db.query(`SELECT COALESCE(SUM(due_amount),0) AS val FROM sales WHERE status IN ('pending','partial')`);
  const [[lowStock]]    = await db.query(`SELECT COUNT(*) AS val FROM products WHERE is_active=1 AND stock_qty <= min_stock`);
  const [[customers]]   = await db.query(`SELECT COUNT(*) AS val FROM customers`);
  const [[products]]    = await db.query(`SELECT COUNT(*) AS val FROM products WHERE is_active=1`);

  // Last 7 days sales chart
  const [dailySales] = await db.query(
    `SELECT sale_date AS date, SUM(total_amount) AS total
     FROM sales WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND status!='cancelled'
     GROUP BY sale_date ORDER BY sale_date`
  );

  // Top 5 products by qty sold this month
  const [topProducts] = await db.query(
    `SELECT p.name, SUM(si.quantity) AS qty_sold, SUM(si.total_price) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id=si.sale_id
     JOIN products p ON p.id=si.product_id
     WHERE s.sale_date>=? AND s.status!='cancelled'
     GROUP BY si.product_id ORDER BY qty_sold DESC LIMIT 5`,
    [firstOfMonth]
  );

  res.json({
    today_sales: todaySales.val,
    month_sales: monthSales.val,
    today_purchases: todayPurch.val,
    month_purchases: monthPurch.val,
    total_due: totalDue.val,
    low_stock_count: lowStock.val,
    total_customers: customers.val,
    total_products: products.val,
    daily_sales: dailySales,
    top_products: topProducts,
  });
};

exports.getSalesReport = async (req, res) => {
  const { from, to, customer_id, payment_method, status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (from) { where += ' AND s.sale_date>=?'; params.push(from); }
  if (to)   { where += ' AND s.sale_date<=?'; params.push(to); }
  if (customer_id) { where += ' AND s.customer_id=?'; params.push(customer_id); }
  if (payment_method) { where += ' AND s.payment_method=?'; params.push(payment_method); }
  if (status) { where += ' AND s.status=?'; params.push(status); }

  const [rows] = await db.query(
    `SELECT s.id, s.invoice_no, s.sale_date, s.total_amount, s.paid_amount,
            s.due_amount, s.payment_method, s.status, c.name AS customer_name
     FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
     ${where} ORDER BY s.sale_date DESC`,
    params
  );
  const [[summary]] = await db.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total_amount),0) AS total,
            COALESCE(SUM(paid_amount),0) AS paid, COALESCE(SUM(due_amount),0) AS due
     FROM sales s ${where}`,
    params
  );
  res.json({ data: rows, summary });
};

exports.getPurchaseReport = async (req, res) => {
  const { from, to, supplier_id, status } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (from) { where += ' AND p.purchase_date>=?'; params.push(from); }
  if (to)   { where += ' AND p.purchase_date<=?'; params.push(to); }
  if (supplier_id) { where += ' AND p.supplier_id=?'; params.push(supplier_id); }
  if (status) { where += ' AND p.status=?'; params.push(status); }

  const [rows] = await db.query(
    `SELECT p.id, p.invoice_no, p.purchase_date, p.total_amount, p.paid_amount,
            p.due_amount, p.payment_method, p.status, s.name AS supplier_name
     FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id
     ${where} ORDER BY p.purchase_date DESC`,
    params
  );
  const [[summary]] = await db.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total_amount),0) AS total,
            COALESCE(SUM(paid_amount),0) AS paid, COALESCE(SUM(due_amount),0) AS due
     FROM purchases p ${where}`,
    params
  );
  res.json({ data: rows, summary });
};

exports.getProfitLoss = async (req, res) => {
  const { from, to } = req.query;
  let whereS = "WHERE s.status!='cancelled'";
  let whereD = 'WHERE 1=1';
  const paramsS = [], paramsD = [];
  if (from) { whereS += ' AND s.sale_date>=?'; whereD += ' AND d.damage_date>=?'; paramsS.push(from); paramsD.push(from); }
  if (to)   { whereS += ' AND s.sale_date<=?'; whereD += ' AND d.damage_date<=?'; paramsS.push(to);   paramsD.push(to); }

  // Revenue & COGS from sales
  const [[rev]] = await db.query(
    `SELECT COALESCE(SUM(si.total_price),0) AS revenue,
            COALESCE(SUM(si.quantity * pr.purchase_price),0) AS cogs
     FROM sale_items si
     JOIN sales s ON s.id=si.sale_id
     JOIN products pr ON pr.id=si.product_id
     ${whereS}`,
    paramsS
  );

  // Total damage loss
  const [[dmg]] = await db.query(
    `SELECT COALESCE(SUM(total_loss),0) AS total_damage_loss FROM damage_records d ${whereD}`,
    paramsD
  );

  // Monthly breakdown (sales)
  const [monthly] = await db.query(
    `SELECT DATE_FORMAT(s.sale_date,'%Y-%m') AS month,
            SUM(si.total_price) AS revenue,
            SUM(si.quantity * pr.purchase_price) AS cogs
     FROM sale_items si
     JOIN sales s ON s.id=si.sale_id
     JOIN products pr ON pr.id=si.product_id
     ${whereS}
     GROUP BY month ORDER BY month`,
    paramsS
  );

  // Monthly damage losses
  const [monthlyDmg] = await db.query(
    `SELECT DATE_FORMAT(d.damage_date,'%Y-%m') AS month,
            COALESCE(SUM(d.total_loss),0) AS damage_loss
     FROM damage_records d ${whereD}
     GROUP BY month ORDER BY month`,
    paramsD
  );

  // Merge damage into monthly
  const dmgMap = {};
  monthlyDmg.forEach(m => { dmgMap[m.month] = Number(m.damage_loss); });

  const mergedMonthly = monthly.map(m => {
    const damage_loss = dmgMap[m.month] || 0;
    const net_profit  = m.revenue - m.cogs - damage_loss;
    return { ...m, damage_loss, profit: m.revenue - m.cogs, net_profit };
  });

  const gross_profit = rev.revenue - rev.cogs;
  const damage_loss  = Number(dmg.total_damage_loss);
  const net_profit   = gross_profit - damage_loss;

  res.json({
    revenue: rev.revenue,
    cogs: rev.cogs,
    gross_profit,
    damage_loss,
    net_profit,
    monthly: mergedMonthly,
  });
};

exports.getInventoryReport = async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.id, p.name, p.barcode, p.sku, p.stock_qty, p.min_stock, p.unit,
            p.purchase_price, p.sale_price,
            (p.stock_qty * p.purchase_price) AS stock_value,
            c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.is_active=1 ORDER BY p.name`
  );
  const [[summary]] = await db.query(
    `SELECT COUNT(*) AS products, SUM(stock_qty) AS total_units,
            SUM(stock_qty*purchase_price) AS total_value,
            SUM(CASE WHEN stock_qty<=min_stock THEN 1 ELSE 0 END) AS low_stock
     FROM products WHERE is_active=1`
  );
  res.json({ data: rows, summary });
};

exports.getCustomerDue = async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.phone, c.email,
            COUNT(s.id) AS total_invoices,
            COALESCE(SUM(s.total_amount),0) AS total_amount,
            COALESCE(SUM(s.due_amount),0) AS due_amount
     FROM customers c
     LEFT JOIN sales s ON s.customer_id=c.id AND s.status IN ('pending','partial')
     GROUP BY c.id HAVING due_amount > 0
     ORDER BY due_amount DESC`
  );
  res.json(rows);
};
