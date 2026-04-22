import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];

export default function NewPurchase() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/suppliers').then(r => setSuppliers(r.data));
  }, []);

  const searchProducts = async (q) => {
    setProductSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await api.get('/products', { params: { search: q, limit: 10 } });
    setSearchResults(data.data);
  };

  const addProduct = (p) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        next[idx].total_price = next[idx].quantity * next[idx].unit_price;
        return next;
      }
      return [...prev, {
        product_id: p.id, name: p.name, barcode: p.barcode,
        unit_price: Number(p.purchase_price), quantity: 1,
        total_price: Number(p.purchase_price)
      }];
    });
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => {
      const next = [...prev];
      next[idx][field] = Number(val);
      next[idx].total_price = next[idx].quantity * next[idx].unit_price;
      return next;
    });
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.total_price, 0);
  const total    = subtotal - Number(discount) + Number(tax) + Number(otherCharges);
  const due      = total - Number(paidAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) return toast.error('Add at least one item');
    setLoading(true);
    try {
      const { data } = await api.post('/purchases', {
        supplier_id: supplierId || null,
        purchase_date: purchaseDate, items, discount, tax, other_charges: otherCharges,
        paid_amount: paidAmount, payment_method: paymentMethod, notes
      });
      toast.success(`Purchase created: ${data.invoice_no}`);
      navigate(`/purchases/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-bag-plus me-2" />New Purchase</h5>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white fw-semibold">Add Products</div>
              <div className="card-body">
                <div className="position-relative mb-3">
                  <input className="form-control" placeholder="Search product to add…"
                    value={productSearch} onChange={e => searchProducts(e.target.value)} />
                  {searchResults.length > 0 && (
                    <div className="list-group position-absolute w-100 shadow" style={{ zIndex: 999 }}>
                      {searchResults.map(p => (
                        <button key={p.id} type="button" className="list-group-item list-group-item-action"
                          onClick={() => addProduct(p)}>
                          <div className="d-flex justify-content-between">
                            <span>{p.name}</span>
                            <span className="badge bg-secondary">${Number(p.purchase_price).toFixed(2)}</span>
                          </div>
                          <small className="text-muted">Stock: {p.stock_qty} | Barcode: {p.barcode}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th></th></tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            <div className="fw-semibold">{item.name}</div>
                            <small className="text-muted font-monospace">{item.barcode}</small>
                          </td>
                          <td>
                            <input type="number" min="0.01" step="0.01" className="form-control form-control-sm"
                              style={{ width: 80 }} value={item.quantity}
                              onChange={e => updateItem(i, 'quantity', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                              style={{ width: 90 }} value={item.unit_price}
                              onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                          </td>
                          <td><strong>${item.total_price.toFixed(2)}</strong></td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-danger"
                              onClick={() => removeItem(i)}>
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!items.length && (
                        <tr><td colSpan={6} className="text-center text-muted py-3">No items added</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-header bg-white fw-semibold">Purchase Details</div>
              <div className="card-body">
                <div className="mb-2">
                  <label className="form-label small">Supplier</label>
                  <select className="form-select form-select-sm" value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}>
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Date</label>
                  <input type="date" className="form-control form-control-sm"
                    value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Payment Method</label>
                  <select className="form-select form-select-sm" value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <hr />
                <div className="d-flex justify-content-between mb-1">
                  <span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <span className="me-auto">Discount</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={discount} onChange={e => setDiscount(e.target.value)} />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-auto">Tax</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={tax} onChange={e => setTax(e.target.value)} />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-auto">Other Charges</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={otherCharges} onChange={e => setOtherCharges(e.target.value)} />
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-1 fw-bold fs-5">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <span className="me-auto text-success fw-semibold">Paid</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-danger fw-semibold">Due</span>
                  <strong className="text-danger">${Math.max(0, due).toFixed(2)}</strong>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Notes</label>
                  <textarea className="form-control form-control-sm" rows={2}
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-circle me-1" />}
                  Create Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
