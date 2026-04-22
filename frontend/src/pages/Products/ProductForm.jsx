import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

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
                  <span className="input-group-text">$</span>
                  <input className="form-control" type="number" min="0" step="0.01" required {...f('purchase_price')} />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Sale Price *</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
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
