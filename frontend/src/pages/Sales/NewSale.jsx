import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];

export default function NewSale() {
  const navigate = useNavigate();
  const barcodeRef = useRef();

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/customers', { params: { limit: 200 } }).then(r => setCustomers(r.data.data));
  }, []);

  const addByBarcode = async () => {
    const code = barcodeInput.trim();
    if (!code) return;
    try {
      const { data: p } = await api.get(`/products/barcode/${code}`);
      addProduct(p);
      setBarcodeInput('');
      barcodeRef.current?.focus();
    } catch {
      toast.error('Product not found');
    }
  };

  const addProduct = (p) => {
    if (Number(p.stock_qty) <= 0) {
      toast.error(`"${p.name}" is out of stock`);
      return;
    }
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id);
      if (idx >= 0) {
        const item = prev[idx];
        const newQty = item.quantity + 1;
        if (newQty > Number(p.stock_qty)) {
          toast.error(`Only ${p.stock_qty} units available for "${p.name}"`);
          return prev;
        }
        return prev.map((it, i) => i === idx
          ? { ...it, quantity: newQty, total_price: newQty * it.unit_price - it.discount }
          : it
        );
      }
      return [...prev, {
        product_id: p.id, name: p.name, barcode: p.barcode,
        unit_price: Number(p.sale_price), quantity: 1, discount: 0,
        total_price: Number(p.sale_price), stock_qty: Number(p.stock_qty)
      }];
    });
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => {
      const item = prev[idx];
      let updated;
      if (field === 'quantity') {
        const maxQty = item.stock_qty;
        const newQty = Math.min(Number(val), maxQty);
        if (Number(val) > maxQty) {
          toast.error(`Only ${maxQty} units available for "${item.name}"`);
        }
        updated = { ...item, quantity: newQty, total_price: newQty * item.unit_price - item.discount };
      } else {
        const patched = { ...item, [field]: Number(val) };
        updated = { ...patched, total_price: patched.quantity * patched.unit_price - patched.discount };
      }
      return prev.map((it, i) => i === idx ? updated : it);
    });
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + i.total_price, 0);
  const total    = subtotal - Number(discount) + Number(tax) + Number(otherCharges);
  const due      = total - Number(paidAmount);

  // Product search modal state
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const searchProducts = async (q) => {
    setProductSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await api.get('/products', { params: { search: q, limit: 10 } });
    setSearchResults(data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) return toast.error('Add at least one item');
    setLoading(true);
    try {
      const { data } = await api.post('/sales', {
        customer_id: customerId || null,
        sale_date: saleDate, items, discount, tax, other_charges: otherCharges, paid_amount: paidAmount,
        payment_method: paymentMethod, notes
      });
      toast.success(`Sale created: ${data.invoice_no}`);
      navigate(`/sales/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-cart-plus me-2" />New Sale</h5>
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Left: Items */}
          <div className="col-lg-8">
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white fw-semibold">Add Products</div>
              <div className="card-body">
                {/* Barcode scanner */}
                <div className="d-flex gap-2 mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-upc-scan" /></span>
                    <input ref={barcodeRef} className="form-control" placeholder="Scan barcode or type…"
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addByBarcode())} />
                    <button type="button" className="btn btn-outline-primary" onClick={addByBarcode}>Add</button>
                  </div>
                  <button type="button" className="btn btn-outline-secondary"
                    onClick={() => setShowSearch(true)}>
                    <i className="bi bi-search" />
                  </button>
                </div>

                {/* Items Table */}
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>#</th><th>Product</th><th>Qty</th>
                        <th>Price</th><th>Discount</th><th>Total</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>
                            <div className="fw-semibold">{item.name}</div>
                            <small className="text-muted font-monospace">{item.barcode}</small>
                            <small className="text-info d-block">Stock: {item.stock_qty}</small>
                          </td>
                          <td>
                            <input type="number" min="0.01" step="0.01" max={item.stock_qty} className="form-control form-control-sm"
                              style={{ width: 75 }} value={item.quantity}
                              onChange={e => updateItem(i, 'quantity', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                              style={{ width: 90 }} value={item.unit_price}
                              onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                              style={{ width: 80 }} value={item.discount}
                              onChange={e => updateItem(i, 'discount', e.target.value)} />
                          </td>
                          <td className="fw-semibold">${item.total_price.toFixed(2)}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-outline-danger"
                              onClick={() => removeItem(i)}>
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!items.length && (
                        <tr><td colSpan={7} className="text-center text-muted py-3">No items added</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="col-lg-4">
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white fw-semibold">Sale Details</div>
              <div className="card-body">
                <div className="mb-2">
                  <label className="form-label small">Customer</label>
                  <select className="form-select form-select-sm" value={customerId}
                    onChange={e => setCustomerId(e.target.value)}>
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Date</label>
                  <input type="date" className="form-control form-control-sm"
                    value={saleDate} onChange={e => setSaleDate(e.target.value)} />
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

                <button type="submit" className="btn btn-success w-100" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-circle me-1" />}
                  Create Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Product Search Modal */}
      {showSearch && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Search Products</h6>
                <button type="button" className="btn-close" onClick={() => setShowSearch(false)} />
              </div>
              <div className="modal-body">
                <input className="form-control mb-3" placeholder="Type product name…"
                  autoFocus value={productSearch} onChange={e => searchProducts(e.target.value)} />
                <div className="list-group">
                  {searchResults.map(p => (
                    <button key={p.id} type="button"
                      className={`list-group-item list-group-item-action ${Number(p.stock_qty) <= 0 ? 'disabled opacity-50' : ''}`}
                      disabled={Number(p.stock_qty) <= 0}
                      onClick={() => { addProduct(p); setShowSearch(false); setProductSearch(''); setSearchResults([]); }}>
                      <div className="d-flex justify-content-between">
                        <span>{p.name}</span>
                        <span className="badge bg-primary">${Number(p.sale_price).toFixed(2)}</span>
                      </div>
                      <small className={`${Number(p.stock_qty) <= 0 ? 'text-danger' : 'text-muted'}`}>
                        Stock: {p.stock_qty} {p.unit} | Barcode: {p.barcode}
                        {Number(p.stock_qty) <= 0 && ' — OUT OF STOCK'}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
