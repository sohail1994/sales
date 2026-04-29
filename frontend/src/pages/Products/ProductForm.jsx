import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const BLANK_UNIT = { label: '', qty_in_base_unit: '', sale_price: '', is_default: false };

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name:'', description:'', category_id:'', supplier_id:'',
    purchase_price:0, sale_price:0, stock_qty:0, min_stock:5,
    unit:'pcs', barcode:'', sku:''
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sale units state
  const [saleUnits, setSaleUnits] = useState([]);
  const [newUnit, setNewUnit] = useState(BLANK_UNIT);
  const [editingUnit, setEditingUnit] = useState(null); // { idx, data }
  const [suLoading, setSuLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
    api.get('/suppliers').then(r => setSuppliers(r.data));
    if (id) {
      api.get(`/products/${id}`).then(r => {
        const p = r.data;
        setForm({
          name: p.name, description: p.description||'',
          category_id: p.category_id||'', supplier_id: p.supplier_id||'',
          purchase_price: p.purchase_price, sale_price: p.sale_price,
          stock_qty: p.stock_qty, min_stock: p.min_stock,
          unit: p.unit, barcode: p.barcode||'', sku: p.sku||''
        });
        if (p.image) setPreview(`http://localhost:5000${p.image}`);
        if (p.sale_units) setSaleUnits(p.sale_units);
      });
    }
  }, [id]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (id) {
        await api.put(`/products/${id}`, fd);
        toast.success('Product updated');
      } else {
        await api.post('/products', fd);
        toast.success('Product created');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  /* ── Sale unit helpers ─────────────────────────────── */
  const addSaleUnit = async () => {
    if (!newUnit.label || !newUnit.qty_in_base_unit || !newUnit.sale_price) {
      return toast.error('Fill label, qty and price');
    }
    setSuLoading(true);
    try {
      await api.post(`/products/${id}/sale-units`, newUnit);
      const { data } = await api.get(`/products/${id}/sale-units`);
      setSaleUnits(data);
      setNewUnit(BLANK_UNIT);
      toast.success('Sale unit added');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    } finally { setSuLoading(false); }
  };

  const startEditUnit = (u) => setEditingUnit({ id: u.id, data: { ...u } });

  const saveEditUnit = async () => {
    if (!editingUnit) return;
    setSuLoading(true);
    try {
      await api.put(`/products/${id}/sale-units/${editingUnit.id}`, editingUnit.data);
      const { data } = await api.get(`/products/${id}/sale-units`);
      setSaleUnits(data);
      setEditingUnit(null);
      toast.success('Sale unit updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error');
    } finally { setSuLoading(false); }
  };

  const removeUnit = async (unitId) => {
    if (!window.confirm('Remove this sale unit?')) return;
    setSuLoading(true);
    try {
      await api.delete(`/products/${id}/sale-units/${unitId}`);
      setSaleUnits(prev => prev.filter(u => u.id !== unitId));
      toast.success('Sale unit removed');
    } catch (e) {
      toast.error('Error removing');
    } finally { setSuLoading(false); }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">
        <i className="bi bi-box-seam me-2" />{id ? 'Edit' : 'New'} Product
      </h5>
      <div className="card shadow-sm" style={{ maxWidth: 800 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-4">
              <div className="border rounded d-inline-flex align-items-center justify-content-center overflow-hidden bg-light"
                style={{ width: 120, height: 120 }}>
                {preview
                  ? <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <i className="bi bi-image text-muted" style={{ fontSize: 48 }} />}
              </div>
              <div className="mt-2">
                <label className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-upload me-1" />Upload Image
                  <input type="file" accept="image/*" hidden onChange={handleImage} />
                </label>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Product Name *</label>
                <input className="form-control" required {...f('name')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Unit</label>
                <select className="form-select" {...f('unit')}>
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilogram</option>
                  <option value="g">Gram</option>
                  <option value="ltr">Litre</option>
                  <option value="ml">Millilitre</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="dozen">Dozen</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select className="form-select" {...f('category_id')}>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Supplier</label>
                <select className="form-select" {...f('supplier_id')}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Barcode</label>
                <input className="form-control font-monospace" placeholder="Auto-generated if empty" {...f('barcode')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">SKU</label>
                <input className="form-control" {...f('sku')} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Purchase Price *</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input className="form-control" type="number" min="0" step="0.01" required {...f('purchase_price')} />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Sale Price *</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input className="form-control" type="number" min="0" step="0.01" required {...f('sale_price')} />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Profit Margin</label>
                <div className="form-control bg-light text-success fw-bold">
                  {form.sale_price && form.purchase_price
                    ? `${(((form.sale_price - form.purchase_price) / form.purchase_price) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Min Stock Alert</label>
                <input className="form-control" type="number" min="0" step="0.01" {...f('min_stock')} />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={2} {...f('description')} />
              </div>
            </div>

            {/* ── Sale Units (fractional selling) ─────────────── */}
            {id && (
              <div className="mt-4">
                <h6 className="fw-semibold mb-2">
                  <i className="bi bi-rulers me-1 text-primary" />
                  Sale Units
                  <small className="text-muted fw-normal ms-2">
                    — define pack sizes (e.g. 100g, 200g) sold from base stock ({form.unit})
                  </small>
                </h6>

                {saleUnits.length > 0 && (
                  <div className="table-responsive mb-3">
                    <table className="table table-sm table-bordered align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Label</th>
                          <th>Qty in {form.unit}</th>
                          <th>Sale Price</th>
                          <th>Default</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleUnits.map(u => (
                          <tr key={u.id}>
                            {editingUnit?.id === u.id ? (
                              <>
                                <td><input className="form-control form-control-sm" value={editingUnit.data.label}
                                  onChange={e => setEditingUnit(ev => ({ ...ev, data: { ...ev.data, label: e.target.value } }))} /></td>
                                <td><input type="number" step="0.0001" min="0.0001" className="form-control form-control-sm"
                                  style={{ width: 90 }} value={editingUnit.data.qty_in_base_unit}
                                  onChange={e => setEditingUnit(ev => ({ ...ev, data: { ...ev.data, qty_in_base_unit: e.target.value } }))} /></td>
                                <td><input type="number" step="0.01" min="0" className="form-control form-control-sm"
                                  style={{ width: 90 }} value={editingUnit.data.sale_price}
                                  onChange={e => setEditingUnit(ev => ({ ...ev, data: { ...ev.data, sale_price: e.target.value } }))} /></td>
                                <td className="text-center">
                                  <input type="checkbox" checked={!!editingUnit.data.is_default}
                                    onChange={e => setEditingUnit(ev => ({ ...ev, data: { ...ev.data, is_default: e.target.checked } }))} />
                                </td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-success me-1" onClick={saveEditUnit} disabled={suLoading}>Save</button>
                                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditingUnit(null)}>Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="fw-semibold">{u.label}</td>
                                <td>{u.qty_in_base_unit} {form.unit}</td>
                                <td>₹{Number(u.sale_price).toFixed(2)}</td>
                                <td className="text-center">{u.is_default ? <span className="badge bg-success">Yes</span> : ''}</td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => startEditUnit(u)}>
                                    <i className="bi bi-pencil" />
                                  </button>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeUnit(u.id)} disabled={suLoading}>
                                    <i className="bi bi-trash" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add new sale unit row */}
                <div className="card bg-light border-0 p-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label small mb-1">Label <span className="text-muted">(e.g. 100g, Half KG)</span></label>
                      <input className="form-control form-control-sm" value={newUnit.label}
                        onChange={e => setNewUnit(n => ({ ...n, label: e.target.value }))} placeholder="100g" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small mb-1">Qty in {form.unit} <span className="text-muted">(e.g. 0.1)</span></label>
                      <input type="number" step="0.0001" min="0.0001" className="form-control form-control-sm"
                        value={newUnit.qty_in_base_unit}
                        onChange={e => setNewUnit(n => ({ ...n, qty_in_base_unit: e.target.value }))} placeholder="0.1" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small mb-1">Sale Price</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text">₹</span>
                        <input type="number" step="0.01" min="0" className="form-control"
                          value={newUnit.sale_price}
                          onChange={e => setNewUnit(n => ({ ...n, sale_price: e.target.value }))} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="col-md-1 text-center">
                      <label className="form-label small mb-1 d-block">Default</label>
                      <input type="checkbox" checked={newUnit.is_default}
                        onChange={e => setNewUnit(n => ({ ...n, is_default: e.target.checked }))} />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-sm btn-primary w-100"
                        onClick={addSaleUnit} disabled={suLoading}>
                        <i className="bi bi-plus me-1" />Add Unit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!id && (
              <div className="alert alert-info mt-3 py-2 small">
                <i className="bi bi-info-circle me-1" />
                Save the product first, then come back to add sale units (e.g. 100g, 200g).
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg me-1" />}
                {id ? 'Update' : 'Create'} Product
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/products')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
