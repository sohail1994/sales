import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY = { name: '', email: '', password: '', role: 'cashier', is_active: 1 };

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null); // null = create, object = edit
  const [form, setForm]           = useState(EMPTY);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/auth/users');
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, is_active: u.is_active });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role, is_active: form.is_active };
        await api.put(`/auth/users/${editing.id}`, payload);
        toast.success('User updated');
      } else {
        if (!form.password) { toast.error('Password is required'); setSaving(false); return; }
        await api.post('/auth/users', form);
        toast.success('User created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
    setSaving(false);
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/auth/users/${u.id}`, {
        name: u.name, email: u.email, role: u.role, is_active: u.is_active ? 0 : 1
      });
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const roleBadge = (role) => {
    const map = { admin: 'danger', manager: 'warning text-dark', cashier: 'success' };
    return <span className={`badge bg-${map[role] || 'secondary'}`}>{role}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0"><i className="bi bi-people-gear me-2" />User Management</h5>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="bi bi-person-plus me-1" />Add User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><span className="spinner-border" /></div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td className="text-muted small">{i + 1}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td>
                        <span className={`badge bg-${u.is_active ? 'success' : 'secondary'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-muted small">{u.created_at?.split('T')[0]}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => openEdit(u)}>
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => toggleActive(u)}
                          >
                            <i className={`bi bi-${u.is_active ? 'person-slash' : 'person-check'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? 'Edit User' : 'Add User'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" required value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" required value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  {!editing && (
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <input type="password" className="form-control" required value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </div>
                  {editing && (
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="isActive"
                        checked={!!form.is_active}
                        onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} />
                      <label className="form-check-label" htmlFor="isActive">Active</label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm" /> : (editing ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
