import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];
const REASONS = ['damaged', 'expired', 'stolen', 'lost', 'other'];
const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function Damages() {
  const [records, setRecords]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [summary, setSummary]     = useState(null);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [products, setProducts]   = useState([]);
  const [form, setForm]           = useState({ product_id: '', damage_date: today(), quantity: '', reason: 'damaged', notes: '' });
  const [saving, setSaving]       = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    const { data } = await api.get('/damages', {
      params: { search, reason: filterReason, from: filterFrom, to: filterTo, page, limit: LIMIT }
    });
    setRecords(data.data);
    setTotal(data.total);
    setSummary(data.summary);
  }, [search, filterReason, filterFrom, filterTo, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/products', { params: { limit: 500 } }).then(r => setProducts(r.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/damages', form);
      toast.success('Damage recorded successfully');
      setShowForm(false);
      setForm({ product_id: '', damage_date: today(), quantity: '', reason: 'damaged', notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this damage record? Stock will be restored.')) return;
    try {
      await api.delete(`/damages/${id}`);
      toast.success('Record deleted, stock restored');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting');
    }
  };

  const reasonBadge = (r) => {
    const map = {
      damaged: 'danger', expired: 'warning', stolen: 'dark', lost: 'secondary', other: 'info'
    };
    return <span className={`badge bg-${map[r] || 'secondary'}`}>{r}</span>;
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0"><i className="bi bi-exclamation-triangle me-2 text-danger" />Damage / Loss Records</h5>
        <button className="btn btn-danger" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-1" />Record Damage
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 bg-danger bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <i className="bi bi-box-seam text-danger fs-2" />
                <div>
                  <div className="fw-bold fs-5">{Number(summary.total_qty || 0).toFixed(2)}</div>
                  <div className="text-muted small">Total Units Damaged</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 bg-warning bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <i className="bi bi-currency-dollar text-warning fs-2" />
                <div>
                  <div className="fw-bold fs-5">{fmt(summary.total_loss)}</div>
                  <div className="text-muted small">Total Stock Loss Value</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 bg-info bg-opacity-10">
              <div className="card-body d-flex align-items-center gap-3">
                <i className="bi bi-list-check text-info fs-2" />
                <div>
                  <div className="fw-bold fs-5">{total}</div>
                  <div className="text-muted small">Total Records</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <input className="form-control" placeholder="Search product…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={filterReason} onChange={e => { setFilterReason(e.target.value); setPage(1); }}>
                <option value="">All Reasons</option>
                {REASONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={filterFrom}
                onChange={e => { setFilterFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={filterTo}
                onChange={e => { setFilterTo(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => {
                setSearch(''); setFilterReason(''); setFilterFrom(''); setFilterTo(''); setPage(1);
              }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th><th>Date</th><th>Product</th><th>Category</th>
                  <th>Reason</th><th>Qty</th><th>Unit Cost</th><th>Total Loss</th>
                  <th>Recorded By</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{(page - 1) * LIMIT + i + 1}</td>
                    <td>{r.damage_date?.substring(0, 10)}</td>
                    <td>
                      <div className="fw-semibold">{r.product_name}</div>
                      <small className="text-muted font-monospace">{r.barcode}</small>
                    </td>
                    <td>{r.category_name || '-'}</td>
                    <td>{reasonBadge(r.reason)}</td>
                    <td>{r.quantity} {r.unit}</td>
                    <td>{fmt(r.unit_cost)}</td>
                    <td className="text-danger fw-semibold">{fmt(r.total_loss)}</td>
                    <td>{r.recorded_by || '-'}</td>
                    <td><small className="text-muted">{r.notes || '-'}</small></td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!records.length && (
                  <tr><td colSpan={11} className="text-center text-muted py-4">No damage records found</td></tr>
                )}
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

      {/* Record Damage Modal */}
      {showForm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h6 className="modal-title"><i className="bi bi-exclamation-triangle me-2" />Record Damage / Loss</h6>
                <button className="btn-close btn-close-white" onClick={() => setShowForm(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Product *</label>
                    <select className="form-select" required
                      value={form.product_id}
                      onChange={e => setForm({ ...form, product_id: e.target.value })}>
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock_qty} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-control" required
                      value={form.damage_date}
                      onChange={e => setForm({ ...form, damage_date: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Quantity *</label>
                    <input type="number" className="form-control" required min="0.01" step="0.01"
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Reason *</label>
                    <select className="form-select" required
                      value={form.reason}
                      onChange={e => setForm({ ...form, reason: e.target.value })}>
                      {REASONS.map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={2}
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <div className="alert alert-warning mb-0 small">
                      <i className="bi bi-info-circle me-1" />
                      Stock will be reduced immediately. Loss value is calculated at purchase cost price.
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-danger" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg me-1" />}
                    Record Damage
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
