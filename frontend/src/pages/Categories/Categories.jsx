import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null); // null | 'new' | category obj
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => api.get('/categories').then(r => setCategories(r.data));
  useEffect(() => { load(); }, []);

  const open = (cat) => {
    setModal(cat || 'new');
    setForm(cat ? { name: cat.name, description: cat.description || '' } : { name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modal === 'new') {
      await api.post('/categories', form);
      toast.success('Category created');
    } else {
      await api.put(`/categories/${modal.id}`, form);
      toast.success('Category updated');
    }
    setModal(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    toast.success('Category deleted');
    load();
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-tags me-2" />Categories</h5>
        <button className="btn btn-primary btn-sm" onClick={() => open(null)}>
          <i className="bi bi-plus me-1" />Add Category
        </button>
      </div>

      <div className="card shadow-sm" style={{ maxWidth: 700 }}>
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-dark">
              <tr><th>#</th><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => open(c)}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              {!categories.length && (
                <tr><td colSpan={4} className="text-center text-muted py-3">No categories</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">{modal === 'new' ? 'New' : 'Edit'} Category</h6>
                <button className="btn-close" onClick={() => setModal(null)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input className="form-control" required value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={2} value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })} />
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
