import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const firstOfMonth = () => new Date().toISOString().substring(0, 7) + '-01';
const todayStr = () => new Date().toISOString().split('T')[0];

export default function SalesReport() {
  const [filters, setFilters] = useState({ from: firstOfMonth(), to: todayStr(), status: '', payment_method: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/reports/sales', { params: filters });
    setReport(data);
    setLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sales Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${filters.from} to ${filters.to}`, 14, 23);

    doc.autoTable({
      startY: 30,
      head: [['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Due', 'Method', 'Status']],
      body: report.data.map(s => [
        s.invoice_no, s.sale_date, s.customer_name || 'Walk-in',
        `$${Number(s.total_amount).toFixed(2)}`,
        `$${Number(s.paid_amount).toFixed(2)}`,
        `$${Number(s.due_amount).toFixed(2)}`,
        s.payment_method, s.status
      ]),
      foot: [['', '', 'TOTAL',
        `$${Number(report.summary.total).toFixed(2)}`,
        `$${Number(report.summary.paid).toFixed(2)}`,
        `$${Number(report.summary.due).toFixed(2)}`, '', ''
      ]],
    });
    doc.save(`sales-report-${filters.from}-${filters.to}.pdf`);
  };

  const chartData = report ? {
    labels: report.data.map(s => s.sale_date).filter((v, i, a) => a.indexOf(v) === i).slice(-14),
    datasets: [{
      label: 'Sales',
      data: (() => {
        const byDate = {};
        report.data.forEach(s => { byDate[s.sale_date] = (byDate[s.sale_date] || 0) + Number(s.total_amount); });
        return Object.values(byDate).slice(-14);
      })(),
      backgroundColor: 'rgba(13,110,253,0.7)',
    }]
  } : null;

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-graph-up me-2" />Sales Report</h5>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-2">
              <label className="form-label small">From</label>
              <input type="date" className="form-control form-control-sm" value={filters.from}
                onChange={e => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label small">To</label>
              <input type="date" className="form-control form-control-sm" value={filters.to}
                onChange={e => setFilters({ ...filters, to: e.target.value })} />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Status</label>
              <select className="form-select form-select-sm" value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Payment</label>
              <select className="form-select form-select-sm" value={filters.payment_method}
                onChange={e => setFilters({ ...filters, payment_method: e.target.value })}>
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-search me-1" />}
                Generate
              </button>
              {report && (
                <button className="btn btn-outline-danger btn-sm" onClick={exportPDF}>
                  <i className="bi bi-file-pdf me-1" />PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {report && (
        <>
          <div className="row g-3 mb-3">
            {[
              { label: 'Total Invoices', val: report.summary.count, color: 'primary' },
              { label: 'Total Amount', val: `$${Number(report.summary.total).toFixed(2)}`, color: 'success' },
              { label: 'Total Paid', val: `$${Number(report.summary.paid).toFixed(2)}`, color: 'info' },
              { label: 'Total Due', val: `$${Number(report.summary.due).toFixed(2)}`, color: 'danger' },
            ].map((s, i) => (
              <div key={i} className="col-md-3">
                <div className={`card border-${s.color} border-2`}>
                  <div className="card-body text-center">
                    <div className={`fw-bold fs-4 text-${s.color}`}>{s.val}</div>
                    <div className="text-muted small">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {chartData && (
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
              </div>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-dark">
                    <tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Paid</th><th>Due</th><th>Method</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {report.data.map(s => (
                      <tr key={s.id}>
                        <td className="fw-semibold">{s.invoice_no}</td>
                        <td>{s.sale_date}</td>
                        <td>{s.customer_name || 'Walk-in'}</td>
                        <td>${Number(s.total_amount).toFixed(2)}</td>
                        <td className="text-success">${Number(s.paid_amount).toFixed(2)}</td>
                        <td className={Number(s.due_amount) > 0 ? 'text-danger' : ''}>${Number(s.due_amount).toFixed(2)}</td>
                        <td className="text-capitalize">{s.payment_method}</td>
                        <td><span className={`badge bg-${s.status === 'paid' ? 'success' : s.status === 'partial' ? 'warning text-dark' : 'danger'}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
