import React, { useState } from 'react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PurchaseBillReport() {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!invoiceNo.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const { data } = await api.get('/reports/purchase-bill', { params: { invoice_no: invoiceNo.trim() } });
      setReport(data);
    } catch (e) {
      setError('Purchase invoice not found. Please check the invoice number.');
    }
    setLoading(false);
  };

  const fmt = v => `₹${Number(v || 0).toFixed(2)}`;

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text(`Purchase Bill Report — ${report.purchase.invoice_no}`, 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Date: ${report.purchase.purchase_date}   |   Supplier: ${report.purchase.supplier_name || '-'}   |   Status: ${report.purchase.status}`,
      14, 23
    );
    doc.autoTable({
      startY: 30,
      head: [['Product', 'Barcode', 'Cost/Unit', 'Sale Price', 'Received', 'Sold', 'Remaining', 'Rem. Value', 'Sold Cost']],
      body: report.items.map(r => [
        r.product_name,
        r.barcode || '-',
        fmt(r.unit_cost),
        fmt(r.sale_price),
        r.qty_received,
        r.qty_sold,
        r.qty_remaining,
        fmt(r.remaining_value),
        fmt(r.sold_cost),
      ]),
    });
    doc.save(`purchase-bill-${report.purchase.invoice_no}.pdf`);
  };

  const p = report ? report.purchase : null;
  const items = report ? report.items : [];
  const totalRec  = items.reduce((s, r) => s + Number(r.qty_received), 0);
  const totalSold = items.reduce((s, r) => s + Number(r.qty_sold), 0);
  const totalRem  = items.reduce((s, r) => s + Number(r.qty_remaining), 0);
  const totalRemVal = items.reduce((s, r) => s + Number(r.remaining_value), 0);
  const totalSoldCost = items.reduce((s, r) => s + Number(r.sold_cost), 0);

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-receipt me-2" />Purchase Bill Report</h5>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Purchase Invoice No (e.g. PUR-000001)</label>
              <input
                className="form-control form-control-sm"
                placeholder="PUR-000001"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()}
              />
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={load} disabled={loading || !invoiceNo.trim()}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Generate'}
              </button>
              {report && (
                <button className="btn btn-outline-danger btn-sm" onClick={exportPDF}>
                  <i className="bi bi-file-pdf me-1" />PDF
                </button>
              )}
            </div>
          </div>
          {error && <div className="alert alert-danger mt-2 mb-0 py-2 small">{error}</div>}
        </div>
      </div>

      {report && (
        <>
          {/* Purchase Header */}
          <div className="card shadow-sm mb-3">
            <div className="card-body py-2">
              <div className="row g-2">
                <div className="col-md-2"><small className="text-muted">Invoice</small><br /><strong>{p.invoice_no}</strong></div>
                <div className="col-md-2"><small className="text-muted">Date</small><br /><strong>{p.purchase_date}</strong></div>
                <div className="col-md-3"><small className="text-muted">Supplier</small><br /><strong>{p.supplier_name || '-'}</strong></div>
                <div className="col-md-2"><small className="text-muted">Total Amount</small><br /><strong>{fmt(p.total_amount)}</strong></div>
                <div className="col-md-2"><small className="text-muted">Due Amount</small><br /><strong className="text-danger">{fmt(p.due_amount)}</strong></div>
                <div className="col-md-1 d-flex align-items-center">
                  <span className={`badge bg-${p.status === 'paid' ? 'success' : p.status === 'partial' ? 'warning' : 'danger'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row g-3 mb-3">
            {[
              { label: 'Products', val: items.length, color: 'primary' },
              { label: 'Total Received', val: totalRec.toFixed(2), color: 'info' },
              { label: 'Total Sold', val: totalSold.toFixed(2), color: 'warning' },
              { label: 'Remaining Value', val: fmt(totalRemVal), color: 'success' },
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

          {/* Items Table */}
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Product</th>
                      <th className="text-end">Cost/Unit</th>
                      <th className="text-end">Sale Price</th>
                      <th className="text-end">Received</th>
                      <th className="text-end">Sold</th>
                      <th className="text-end">Remaining</th>
                      <th className="text-end">Rem. Value</th>
                      <th className="text-end">Sold Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.batch_id} className={Number(r.qty_remaining) === 0 ? 'table-secondary text-muted' : ''}>
                        <td>
                          <strong>{r.product_name}</strong>
                          {r.barcode && <><br /><small className="text-muted">{r.barcode}</small></>}
                        </td>
                        <td className="text-end">{fmt(r.unit_cost)}</td>
                        <td className="text-end">{fmt(r.sale_price)}</td>
                        <td className="text-end">{r.qty_received}</td>
                        <td className="text-end">{r.qty_sold}</td>
                        <td className="text-end fw-bold">{r.qty_remaining}</td>
                        <td className="text-end">{fmt(r.remaining_value)}</td>
                        <td className="text-end">{fmt(r.sold_cost)}</td>
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
                      <td>Total</td>
                      <td></td>
                      <td></td>
                      <td className="text-end">{totalRec.toFixed(2)}</td>
                      <td className="text-end">{totalSold.toFixed(2)}</td>
                      <td className="text-end">{totalRem.toFixed(2)}</td>
                      <td className="text-end">{fmt(totalRemVal)}</td>
                      <td className="text-end">{fmt(totalSoldCost)}</td>
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
