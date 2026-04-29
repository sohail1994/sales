import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function BatchReport() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ product_id: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/products', { params: { limit: 1000 } }).then(({ data }) => setProducts(data.data));
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/reports/batch-stock', { params: filters });
    setReport(data);
    setLoading(false);
  };

  const fmt = v => `₹${Number(v || 0).toFixed(2)}`;

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('Batch Stock Report', 14, 15);
    doc.autoTable({
      startY: 22,
      head: [['Product', 'Purchase Invoice', 'Supplier', 'Date', 'Cost/Unit', 'Received', 'Sold', 'Remaining', 'Rem. Value']],
      body: report.map(r => [
        r.product_name,
        r.purchase_invoice,
        r.supplier_name || '-',
        r.purchase_date,
        fmt(r.unit_cost),
        r.qty_received,
        r.qty_sold,
        r.qty_remaining,
        fmt(Number(r.qty_remaining) * Number(r.unit_cost)),
      ]),
    });
    doc.save('batch-stock-report.pdf');
  };

  const totalReceived = report ? report.reduce((s, r) => s + Number(r.qty_received), 0) : 0;
  const totalSold     = report ? report.reduce((s, r) => s + Number(r.qty_sold), 0) : 0;
  const totalRemaining = report ? report.reduce((s, r) => s + Number(r.qty_remaining), 0) : 0;
  const totalValue    = report ? report.reduce((s, r) => s + Number(r.qty_remaining) * Number(r.unit_cost), 0) : 0;

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-layers me-2" />Batch Stock Report</h5>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Filter by Product (optional)</label>
              <select className="form-select form-select-sm" value={filters.product_id}
                onChange={e => setFilters({ ...filters, product_id: e.target.value })}>
                <option value="">All Products</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-md-4 d-flex gap-2">
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
              { label: 'Total Batches', val: report.length, color: 'primary' },
              { label: 'Total Received', val: totalReceived.toFixed(2), color: 'info' },
              { label: 'Total Sold', val: totalSold.toFixed(2), color: 'warning' },
              { label: 'Total Remaining Value', val: fmt(totalValue), color: 'success' },
            ].map((s, i) => (
              <div key={i} className="col-md-3">
                <div className={`card border-${s.color} border-2`}>
                  <div className="card-body text-center py-2">
                    <div className={`fw-bold fs-5 text-${s.color}`}>{s.val}</div>
                    <div className="text-muted small">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Product</th>
                      <th>Purchase Bill</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th className="text-end">Cost/Unit</th>
                      <th className="text-end">Received</th>
                      <th className="text-end">Sold</th>
                      <th className="text-end">Remaining</th>
                      <th className="text-end">Rem. Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map(r => (
                      <tr key={r.batch_id} className={Number(r.qty_remaining) === 0 ? 'table-secondary text-muted' : ''}>
                        <td>
                          <strong>{r.product_name}</strong>
                          {r.barcode && <><br /><small className="text-muted">{r.barcode}</small></>}
                        </td>
                        <td><span className="badge bg-info text-dark">{r.purchase_invoice}</span></td>
                        <td>{r.supplier_name || '-'}</td>
                        <td>{r.purchase_date}</td>
                        <td className="text-end">{fmt(r.unit_cost)}</td>
                        <td className="text-end">{r.qty_received}</td>
                        <td className="text-end">{r.qty_sold}</td>
                        <td className="text-end fw-bold">{r.qty_remaining}</td>
                        <td className="text-end">{fmt(Number(r.qty_remaining) * Number(r.unit_cost))}</td>
                        <td>
                          {Number(r.qty_remaining) === 0
                            ? <span className="badge bg-secondary">Exhausted</span>
                            : Number(r.qty_remaining) === Number(r.qty_received)
                              ? <span className="badge bg-success">Full</span>
                              : <span className="badge bg-warning text-dark">Partial</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan={5}>Total</td>
                      <td className="text-end">{totalReceived.toFixed(2)}</td>
                      <td className="text-end">{totalSold.toFixed(2)}</td>
                      <td className="text-end">{totalRemaining.toFixed(2)}</td>
                      <td className="text-end">{fmt(totalValue)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
