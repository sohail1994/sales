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
    const saleUnits = p.sale_units || [];
    const defaultUnit = saleUnits.find(u => u.is_default) || (saleUnits.length ? saleUnits[0] : null);

    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === p.id);
      if (idx >= 0) {
        const item = prev[idx];
        const newQty = item.quantity + 1;
        const baseDeducted = item.sale_unit_factor
          ? newQty * item.sale_unit_factor
          : newQty;
        if (baseDeducted > Number(p.stock_qty)) {
          toast.error(`Only ${p.stock_qty} ${p.unit} available for "${p.name}"`);
          return prev;
        }
        return prev.map((it, i) => i === idx
          ? { ...it, quantity: newQty, total_price: newQty * it.unit_price - it.discount }
          : it
        );
      }
      const unitPrice = defaultUnit ? Number(defaultUnit.sale_price) : Number(p.sale_price);
      return [...prev, {
        product_id: p.id, name: p.name, barcode: p.barcode,
        unit: p.unit,
        base_sale_price: Number(p.sale_price),
        unit_price: unitPrice, quantity: 1, discount: 0,
        total_price: unitPrice, stock_qty: Number(p.stock_qty),
        sale_units: saleUnits,
        sale_unit_id: defaultUnit?.id || null,
        sale_unit_label: defaultUnit?.label || null,
        sale_unit_factor: defaultUnit ? Number(defaultUnit.qty_in_base_unit) : null,
      }];
    });
  };

  // Change sale unit for a cart item (e.g. switch from 100g to 200g)
  const changeSaleUnit = (idx, unitId) => {
    setItems(prev => {
      const item = prev[idx];
      if (!unitId) {
        // Revert to base unit — use stored base_sale_price
        const basePrice = item.base_sale_price || item.unit_price;
        return prev.map((it, i) => i !== idx ? it : {
          ...it, sale_unit_id: null, sale_unit_label: null, sale_unit_factor: null,
          unit_price: basePrice,
          total_price: it.quantity * basePrice - it.discount,
        });
      }
      const su = item.sale_units.find(u => u.id === Number(unitId));
      if (!su) return prev;
      return prev.map((it, i) => i !== idx ? it : {
        ...it,
        sale_unit_id: su.id, sale_unit_label: su.label, sale_unit_factor: Number(su.qty_in_base_unit),
        unit_price: Number(su.sale_price),
        total_price: it.quantity * Number(su.sale_price) - it.discount,
      });
    });
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => {
      const item = prev[idx];
      let updated;
      if (field === 'quantity') {
        if (val === '' || val === null) {
          updated = { ...item, quantity: '' };
          return prev.map((it, i) => i === idx ? updated : it);
        }
        const newQty = Number(val);
        const baseDeducted = item.sale_unit_factor ? newQty * item.sale_unit_factor : newQty;
        if (baseDeducted > item.stock_qty) {
          const maxPacks = item.sale_unit_factor
            ? Math.floor(item.stock_qty / item.sale_unit_factor)
            : item.stock_qty;
          toast.error(`Only ${maxPacks} ${item.sale_unit_label || item.unit} available for "${item.name}"`);
          const cappedQty = item.sale_unit_factor ? maxPacks : item.stock_qty;
          updated = { ...item, quantity: cappedQty, total_price: cappedQty * item.unit_price - item.discount };
        } else {
          updated = { ...item, quantity: newQty, total_price: newQty * item.unit_price - item.discount };
        }
      } else {
        const patched = { ...item, [field]: val === '' ? '' : Number(val) };
        updated = { ...patched, total_price: Number(patched.quantity) * Number(patched.unit_price) - Number(patched.discount) };
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
    // Fetch sale_units for each result via full product fetch to keep it accurate
    setSearchResults(data.data);
  };

  // When user picks from search modal, load full product (with sale_units) then add
  const addProductFromSearch = async (p) => {
    try {
      const { data: full } = await api.get(`/products/${p.id}`);
      addProduct(full);
    } catch {
      addProduct(p);
    }
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
                        <th>#</th><th>Product</th><th>Pack Size</th><th>Qty</th>
                        <th>Price/Unit</th><th>Discount</th><th>Total</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => {
                        const baseDeducted = item.sale_unit_factor
                          ? (item.quantity * item.sale_unit_factor).toFixed(4)
                          : item.quantity;
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>
                              <div className="fw-semibold">{item.name}</div>
                              <small className="text-muted font-monospace">{item.barcode}</small>
                              <small className="text-info d-block">
                                Stock: {item.stock_qty} {item.unit}
                                {item.sale_unit_factor && (
                                  <span className="ms-1 text-warning">
                                    (≈{(item.stock_qty / item.sale_unit_factor).toFixed(0)} packs)
                                  </span>
                                )}
                              </small>
                            </td>
                            <td style={{ minWidth: 130 }}>
                              {item.sale_units && item.sale_units.length > 0 ? (
                                <select className="form-select form-select-sm"
                                  value={item.sale_unit_id || ''}
                                  onChange={e => changeSaleUnit(i, e.target.value)}>
                                  <option value="">— base ({item.unit}) —</option>
                                  {item.sale_units.map(u => (
                                    <option key={u.id} value={u.id}>
                                      {u.label} ({u.qty_in_base_unit} {item.unit})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-muted small">{item.unit}</span>
                              )}
                              {item.sale_unit_factor && (
                                <small className="text-muted d-block mt-1">
                                  Deducts: {baseDeducted} {item.unit}
                                </small>
                              )}
                            </td>
                            <td>
                              <input type="number" min="0.050" step="0.001" className="form-control form-control-sm"
                                style={{ width: 70 }} value={item.quantity}
                                onFocus={e => e.target.select()}
                                onChange={e => updateItem(i, 'quantity', e.target.value)}
                                onBlur={e => { if (e.target.value === '' || Number(e.target.value) <= 0) updateItem(i, 'quantity', 0.05); }} />
                            </td>
                            <td>
                              <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                                style={{ width: 90 }} value={item.unit_price}
                                onFocus={e => e.target.select()}
                                onChange={e => updateItem(i, 'unit_price', e.target.value)}
                                onBlur={e => { if (e.target.value === '') updateItem(i, 'unit_price', 0); }} />
                            </td>
                            <td>
                              <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                                style={{ width: 80 }} value={item.discount}
                                onFocus={e => e.target.select()}
                                onChange={e => updateItem(i, 'discount', e.target.value)}
                                onBlur={e => { if (e.target.value === '') updateItem(i, 'discount', 0); }} />
                            </td>
                            <td className="fw-semibold">₹{item.total_price.toFixed(2)}</td>
                            <td>
                              <button type="button" className="btn btn-sm btn-outline-danger"
                                onClick={() => removeItem(i)}>
                                <i className="bi bi-trash" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!items.length && (
                        <tr><td colSpan={8} className="text-center text-muted py-3">No items added</td></tr>
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
                  <span>Subtotal</span><strong>₹{subtotal.toFixed(2)}</strong>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <span className="me-auto">Discount</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={discount}
                    onFocus={e => e.target.select()}
                    onChange={e => setDiscount(e.target.value)}
                    onBlur={e => { if (e.target.value === '') setDiscount(0); }} />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-auto">Tax</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={tax}
                    onFocus={e => e.target.select()}
                    onChange={e => setTax(e.target.value)}
                    onBlur={e => { if (e.target.value === '') setTax(0); }} />
                </div>
                <div className="d-flex align-items-center mb-2">
                  <span className="me-auto">Other Charges</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={otherCharges}
                    onFocus={e => e.target.select()}
                    onChange={e => setOtherCharges(e.target.value)}
                    onBlur={e => { if (e.target.value === '') setOtherCharges(0); }} />
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-1 fw-bold fs-5">
                  <span>Total</span><span>₹{total.toFixed(2)}</span>
                </div>
                <div className="d-flex align-items-center mb-1">
                  <span className="me-auto text-success fw-semibold">Paid</span>
                  <input type="number" min="0" step="0.01" className="form-control form-control-sm"
                    style={{ width: 90 }} value={paidAmount}
                    onFocus={e => e.target.select()}
                    onChange={e => setPaidAmount(e.target.value)}
                    onBlur={e => { if (e.target.value === '') setPaidAmount(0); }} />
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-danger fw-semibold">Due</span>
                  <strong className="text-danger">₹{Math.max(0, due).toFixed(2)}</strong>
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
                      onClick={() => { addProductFromSearch(p); setShowSearch(false); setProductSearch(''); setSearchResults([]); }}>
                      <div className="d-flex justify-content-between">
                        <span>{p.name}</span>
                        <span className="badge bg-primary">₹{Number(p.sale_price).toFixed(2)}</span>
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
