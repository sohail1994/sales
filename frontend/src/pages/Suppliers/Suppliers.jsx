import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const empty = { name: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const load = () => api.get('/suppliers', { params: { search } }).then(r => setSuppliers(r.data));
  useEffect(() => { load(); }, [search]);

  const open = (s) => {
    setModal(s || 'new');
    setForm(s ? { name: s.name, phone: s.phone||'', email: s.email||'', address: s.address||'' } : empty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modal === 'new') {
      await api.post('/suppliers', form);
      toast.success('Supplier created');
    } else {
      await api.put(`/suppliers/${modal.id}`, form);
      toast.success('Supplier updated');
    }
    setModal(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    await api.delete(`/suppliers/${id}`);
    toast.success('Supplier deleted');
    load();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-truck me-2" />Suppliers</h5>
        <button className="btn btn-primary btn-sm" onClick={() => open(null)}>
          <i className="bi bi-plus me-1" />Add Supplier
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="input-group mb-3" style={{ maxWidth: 350 }}>
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input className="form-control" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td>{s.address || '-'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => open(s)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(s.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!suppliers.length && (
                  <tr><td colSpan={6} className="text-center text-muted py-3">No suppliers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">{modal === 'new' ? 'New' : 'Edit'} Supplier</h6>
                <button className="btn-close" onClick={() => setModal(null)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Name *</label>
                    <input className="form-control" required value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input className="form-control" type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={2} value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
