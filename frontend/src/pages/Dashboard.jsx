import React, { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend);

const Stat = ({ icon, label, value, color, sub }) => (
  <div className="col-md-3 col-sm-6">
    <div className={`card stat-card text-white bg-${color} mb-3`}>
      <div className="card-body d-flex align-items-center gap-3">
        <i className={`bi bi-${icon}`} style={{ fontSize: 36 }} />
        <div>
          <div className="fs-4 fw-bold">{value}</div>
          <div className="small opacity-75">{label}</div>
          {sub && <div className="small opacity-75">{sub}</div>}
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => { setData(r.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-5"><span className="spinner-border" /></div>;

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  const dailyChart = {
    labels: data.daily_sales.map(d => d.date),
    datasets: [{
      label: 'Daily Sales',
      data: data.daily_sales.map(d => d.total),
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13,110,253,0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  const topProductsChart = {
    labels: data.top_products.map(p => p.name),
    datasets: [{
      label: 'Qty Sold',
      data: data.top_products.map(p => p.qty_sold),
      backgroundColor: ['#0d6efd','#198754','#ffc107','#dc3545','#6f42c1'],
    }],
  };

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-speedometer2 me-2" />Dashboard</h5>

      <div className="row">
        <Stat icon="cart-check"  label="Today's Sales"      value={`₹${fmt(data.today_sales)}`}     color="primary" />
        <Stat icon="graph-up"    label="Month Sales"        value={`₹${fmt(data.month_sales)}`}     color="success" />
        <Stat icon="bag-plus"    label="Today Purchases"    value={`₹${fmt(data.today_purchases)}`} color="warning" />
        <Stat icon="exclamation-circle" label="Total Due"  value={`₹${fmt(data.total_due)}`}        color="danger" />
        <Stat icon="people"      label="Total Customers"    value={data.total_customers}             color="info" />
        <Stat icon="box-seam"    label="Total Products"     value={data.total_products}              color="secondary" />
        <Stat icon="exclamation-triangle" label="Low Stock" value={data.low_stock_count}             color="danger" />
        <Stat icon="shop"        label="Month Purchases"    value={`₹${fmt(data.month_purchases)}`} color="dark" />
      </div>

      <div className="row mt-3">
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-semibold">
              <i className="bi bi-graph-up me-2 text-primary" />Last 7 Days Sales
            </div>
            <div className="card-body">
              <Line data={dailyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-semibold">
              <i className="bi bi-trophy me-2 text-warning" />Top Products (This Month)
            </div>
            <div className="card-body">
              {data.top_products.length > 0
                ? <Bar data={topProductsChart} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }} />
                : <p className="text-muted text-center py-3">No sales this month</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
