import React, { useState } from 'react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const firstOfMonth = () => new Date().toISOString().substring(0, 7) + '-01';
const todayStr = () => new Date().toISOString().split('T')[0];

export default function PurchaseReport() {
  const [filters, setFilters] = useState({ from: firstOfMonth(), to: todayStr(), status: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/reports/purchases', { params: filters });
    setReport(data);
    setLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Purchase Report', 14, 15);
    doc.text(`Period: ${filters.from} to ${filters.to}`, 14, 23);
    doc.autoTable({
      startY: 30,
      head: [['Invoice', 'Date', 'Supplier', 'Total', 'Paid', 'Due', 'Status']],
      body: report.data.map(p => [
        p.invoice_no, p.purchase_date, p.supplier_name || '-',
        `₹${Number(p.total_amount).toFixed(2)}`,
        `₹${Number(p.paid_amount).toFixed(2)}`,
        `₹${Number(p.due_amount).toFixed(2)}`,
        p.status
      ]),
    });
    doc.save(`purchase-report-${filters.from}-${filters.to}.pdf`);
  };

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-graph-down me-2" />Purchase Report</h5>

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
            <div className="col-md-3 d-flex align-items-end gap-2">
              <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Generate'}
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
              { label: 'Total Amount', val: `₹${Number(report.summary.total).toFixed(2)}`, color: 'warning' },
              { label: 'Total Paid', val: `₹${Number(report.summary.paid).toFixed(2)}`, color: 'success' },
              { label: 'Total Due', val: `₹${Number(report.summary.due).toFixed(2)}`, color: 'danger' },
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
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-dark">
                    <tr><th>Invoice</th><th>Date</th><th>Supplier</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {report.data.map(p => (
                      <tr key={p.id}>
                        <td className="fw-semibold">{p.invoice_no}</td>
                        <td>{p.purchase_date}</td>
                        <td>{p.supplier_name || '-'}</td>
                        <td>₹{Number(p.total_amount).toFixed(2)}</td>
                        <td className="text-success">₹{Number(p.paid_amount).toFixed(2)}</td>
                        <td className={Number(p.due_amount) > 0 ? 'text-danger' : ''}>₹{Number(p.due_amount).toFixed(2)}</td>
                        <td><span className={`badge bg-${p.status === 'paid' ? 'success' : p.status === 'partial' ? 'warning text-dark' : 'danger'}`}>{p.status}</span></td>
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
