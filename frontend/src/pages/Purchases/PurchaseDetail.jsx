import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import BarcodePrintSheet from '../Products/BarcodePrintSheet';

const today = () => new Date().toISOString().split('T')[0];

export default function PurchaseDetail() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: 'cash', payment_date: today(), notes: '' });
  const [showPay, setShowPay] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = () => api.get(`/purchases/${id}`).then(r => setPurchase(r.data));
  useEffect(() => { load(); }, [id]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/purchases/${id}/payment`, payForm);
      toast.success('Payment recorded');
      setShowPay(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!purchase) return <div className="text-center py-5"><span className="spinner-border" /></div>;
  const fmt = (n) => `₹${Number(n).toFixed(2)}`;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-bag-plus me-2" />{purchase.invoice_no}</h5>
        <div className="d-flex gap-2">
          {purchase.status !== 'paid' && (
            <button className="btn btn-sm btn-success" onClick={() => setShowPay(true)}>
              <i className="bi bi-cash me-1" />Add Payment
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPrint(true)}>
            <i className="bi bi-printer me-1" />Print Labels
          </button>
          <Link to="/purchases" className="btn btn-sm btn-outline-secondary">Back</Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Purchase Information</h6>
              <table className="table table-sm table-borderless">
                <tbody>
                  <tr><td className="text-muted w-50">Invoice No</td><td><strong>{purchase.invoice_no}</strong></td></tr>
                  <tr><td className="text-muted">Date</td><td>{purchase.purchase_date}</td></tr>
                  <tr><td className="text-muted">Supplier</td><td>{purchase.supplier_name || '-'}</td></tr>
                  <tr><td className="text-muted">Payment</td><td className="text-capitalize">{purchase.payment_method}</td></tr>
                  <tr><td className="text-muted">Status</td>
                    <td><span className={`badge bg-${purchase.status === 'paid' ? 'success' : purchase.status === 'partial' ? 'warning' : 'danger'}`}>{purchase.status}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Summary</h6>
              <div className="d-flex justify-content-between mb-1"><span>Subtotal</span><span>{fmt(purchase.subtotal)}</span></div>
              <div className="d-flex justify-content-between mb-1"><span>Discount</span><span>- {fmt(purchase.discount)}</span></div>
              <div className="d-flex justify-content-between mb-2"><span>Tax</span><span>+ {fmt(purchase.tax)}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>{fmt(purchase.total_amount)}</span></div>
              <div className="d-flex justify-content-between text-success"><span>Paid</span><span>{fmt(purchase.paid_amount)}</span></div>
              <div className="d-flex justify-content-between text-danger fw-bold"><span>Due</span><span>{fmt(purchase.due_amount)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Items ({purchase.items?.length})</h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead className="table-light">
                <tr><th>#</th><th>Product</th><th>Barcode</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                {purchase.items?.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.product_name}</td>
                    <td><small className="font-monospace">{item.barcode}</small></td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.unit_price)}</td>
                    <td><strong>{fmt(item.total_price)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
                        value={payForm.amount}
                        onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                    </div>
                    <small className="text-muted">Due: {fmt(purchase.due_amount)}</small>
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
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" required value={payForm.payment_date}
                      onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success" disabled={loading}>Save Payment</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPay(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPrint && (
        <BarcodePrintSheet
          products={(purchase.items || []).map(item => ({
            id: item.product_id,
            name: item.product_name,
            barcode: item.barcode,
            sale_price: item.sale_price,
            defaultQty: item.quantity,
          }))}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
