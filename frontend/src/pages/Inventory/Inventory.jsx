import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function Inventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: 0, type: 'remove', notes: '' });
  const LIMIT = 20;

  const load = useCallback(async () => {
    const { data } = await api.get('/inventory', { params: { search, low_stock: lowStock, page, limit: LIMIT } });
    setItems(data.data);
    setTotal(data.total);
  }, [search, lowStock, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/inventory/value').then(r => setSummary(r.data));
  }, []);

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', {
        product_id: adjustModal.id,
        quantity: adjustForm.quantity,
        type: adjustForm.type,
        notes: adjustForm.notes
      });
      toast.success('Stock adjusted');
      setAdjustModal(null);
      load();
      api.get('/inventory/value').then(r => setSummary(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-archive me-2" />Inventory</h5>

      {summary && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Products', value: summary.total_products, color: 'primary', icon: 'box-seam' },
            { label: 'Total Units', value: Number(summary.total_units || 0).toFixed(0), color: 'info', icon: 'stack' },
            { label: 'Stock Value (Cost)', value: `$${Number(summary.total_value || 0).toFixed(2)}`, color: 'success', icon: 'currency-dollar' },
            { label: 'Sale Value', value: `$${Number(summary.total_sale_value || 0).toFixed(2)}`, color: 'warning', icon: 'graph-up' },
          ].map((s, i) => (
            <div key={i} className="col-md-3">
              <div className={`card border-0 bg-${s.color} bg-opacity-10`}>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    <i className={`bi bi-${s.icon} text-${s.color} fs-3`} />
                    <div>
                      <div className="fw-bold fs-5">{s.value}</div>
                      <div className="text-muted small">{s.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <input className="form-control" placeholder="Search product…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="lowStk"
                  checked={lowStock} onChange={e => { setLowStock(e.target.checked); setPage(1); }} />
                <label className="form-check-label text-danger" htmlFor="lowStk">Low Stock Only</label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Product</th><th>Barcode</th><th>Category</th>
                  <th>Stock</th><th>Min Stock</th><th>Unit</th>
                  <th>Cost Price</th><th>Sale Price</th><th>Stock Value</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} className={p.stock_qty <= p.min_stock ? 'table-warning' : ''}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {p.image
                          ? <img src={`http://localhost:5000${p.image}`} alt={p.name}
                              style={{ width: 35, height: 35, objectFit: 'cover', borderRadius: 4 }} />
                          : <div className="bg-light rounded d-flex align-items-center justify-content-center"
                              style={{ width: 35, height: 35 }}>
                              <i className="bi bi-image text-muted" />
                            </div>}
                        <span className="fw-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td><small className="font-monospace">{p.barcode}</small></td>
                    <td>{p.category_name || '-'}</td>
                    <td>
                      <span className={`badge ${p.stock_qty <= p.min_stock ? 'bg-danger' : 'bg-success'} fs-6`}>
                        {p.stock_qty}
                      </span>
                    </td>
                    <td>{p.min_stock}</td>
                    <td>{p.unit}</td>
                    <td>${Number(p.purchase_price).toFixed(2)}</td>
                    <td>${Number(p.sale_price).toFixed(2)}</td>
                    <td>${(Number(p.stock_qty) * Number(p.purchase_price)).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => { setAdjustModal(p); setAdjustForm({ quantity: 0, type: 'remove', notes: '' }); }}>
                        <i className="bi bi-arrows-collapse me-1" />Adjust
                      </button>
                      <button className="btn btn-sm btn-outline-danger"
                        onClick={() => navigate('/damages')}
                        title="Record damage/loss for this product">
                        <i className="bi bi-exclamation-triangle me-1" />Damage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <nav>
              <ul className="pagination pagination-sm justify-content-end">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      {adjustModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Adjust Stock: <strong>{adjustModal.name}</strong></h6>
                <button className="btn-close" onClick={() => setAdjustModal(null)} />
              </div>
              <form onSubmit={handleAdjust}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <div className="alert alert-info mb-0">
                      Current Stock: <strong>{adjustModal.stock_qty} {adjustModal.unit}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Adjustment Type</label>
                    <select className="form-select" value={adjustForm.type}
                      onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value })}>
                      <option value="remove">Remove Stock (Damage/Loss)</option>
                      <option value="set">Set Exact Qty (Physical Count)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Quantity</label>
                    <input type="number" className="form-control" min="0" step="0.01" required
                      value={adjustForm.quantity}
                      onChange={e => setAdjustForm({ ...adjustForm, quantity: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={2} value={adjustForm.notes}
                      onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Apply Adjustment</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
