import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];

export default function SaleDetail() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: 'cash', payment_date: today(), notes: '' });
  const [showPay, setShowPay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = () => api.get(`/sales/${id}`).then(r => setSale(r.data));
  useEffect(() => { load(); }, [id]);

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { data } = await api.get(`/sales/${id}/invoice-pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${sale.invoice_no}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/sales/${id}/payment`, payForm);
      toast.success('Payment recorded');
      setShowPay(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return <div className="text-center py-5"><span className="spinner-border" /></div>;

  const fmt = (n) => `₹${Number(n).toFixed(2)}`;
  const statusColor = { paid:'success', partial:'warning', pending:'danger', cancelled:'secondary' };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">
          <i className="bi bi-receipt me-2" />Invoice: {sale.invoice_no}
        </h5>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-danger"
            onClick={downloadPDF} disabled={pdfLoading}>
            {pdfLoading
              ? <span className="spinner-border spinner-border-sm me-1" />
              : <i className="bi bi-file-pdf me-1" />}
            Download PDF
          </button>
          {sale.status !== 'paid' && sale.status !== 'cancelled' && (
            <button className="btn btn-sm btn-success" onClick={() => setShowPay(true)}>
              <i className="bi bi-cash me-1" />Add Payment
            </button>
          )}
          <Link to="/sales" className="btn btn-sm btn-outline-secondary">Back</Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Sale Information</h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr><td className="text-muted" width={130}>Invoice</td><td><strong>{sale.invoice_no}</strong></td></tr>
                  <tr><td className="text-muted">Date</td><td>{sale.sale_date}</td></tr>
                  <tr><td className="text-muted">Status</td>
                    <td><span className={`badge bg-${statusColor[sale.status]}`}>{sale.status}</span></td>
                  </tr>
                  <tr><td className="text-muted">Payment</td><td className="text-capitalize">{sale.payment_method}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Customer</h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr><td className="text-muted" width={80}>Name</td><td>{sale.customer_name || 'Walk-in'}</td></tr>
                  <tr><td className="text-muted">Phone</td><td>{sale.customer_phone || '-'}</td></tr>
                  <tr><td className="text-muted">Email</td><td>{sale.customer_email || '-'}</td></tr>
                  <tr><td className="text-muted">Address</td><td>{sale.customer_address || '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Items</h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Product</th><th>Barcode</th><th>Pack</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr>
              </thead>
              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.product_name}</td>
                    <td><small className="font-monospace">{item.barcode}</small></td>
                    <td>
                      {item.sale_unit_label
                        ? <span className="badge bg-info text-dark">{item.sale_unit_label}</span>
                        : <span className="text-muted small">base</span>}
                      {item.base_qty_deducted && item.sale_unit_factor ? (
                        <small className="text-muted d-block">
                          ({Number(item.base_qty_deducted).toFixed(4)} stock unit)
                        </small>
                      ) : null}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.unit_price)}</td>
                    <td>{fmt(item.discount)}</td>
                    <td><strong>{fmt(item.total_price)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light fw-semibold">
                <tr><td colSpan={7} className="text-end">Subtotal</td><td>{fmt(sale.subtotal)}</td></tr>
                <tr><td colSpan={7} className="text-end">Discount</td><td>- {fmt(sale.discount)}</td></tr>
                <tr><td colSpan={7} className="text-end">Tax</td><td>+ {fmt(sale.tax)}</td></tr>
                <tr className="fs-5"><td colSpan={7} className="text-end fw-bold">Total</td><td className="fw-bold">{fmt(sale.total_amount)}</td></tr>
                <tr><td colSpan={7} className="text-end text-success">Paid</td><td className="text-success">{fmt(sale.paid_amount)}</td></tr>
                <tr><td colSpan={7} className="text-end text-danger">Due</td><td className="text-danger fw-bold">{fmt(sale.due_amount)}</td></tr>
              </tfoot>
            </table>
          </div>
          {sale.notes && <p className="text-muted mt-2"><strong>Notes:</strong> {sale.notes}</p>}
        </div>
      </div>

      {/* Payment Modal */}
      {showPay && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Add Payment</h6>
                <button className="btn-close" onClick={() => setShowPay(false)} />
              </div>
              <form onSubmit={handlePayment}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Amount *</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input type="number" className="form-control" min="0.01" step="0.01" required
                        max={Number(sale.due_amount)}
                        value={payForm.amount}
                        onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                    </div>
                    <small className="text-muted">Due: {fmt(sale.due_amount)}</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={payForm.payment_method}
                      onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Payment Date</label>
                    <input type="date" className="form-control" required value={payForm.payment_date}
                      onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={2} value={payForm.notes}
                      onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm" /> : 'Save Payment'}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPay(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
