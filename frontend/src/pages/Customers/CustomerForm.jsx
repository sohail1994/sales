import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', credit_limit:0, notes:'' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/customers/${id}`).then(r => {
        const c = r.data;
        setForm({ name: c.name, phone: c.phone||'', email: c.email||'',
                  address: c.address||'', credit_limit: c.credit_limit||0, notes: c.notes||'' });
        if (c.image) setPreview(`http://localhost:5000${c.image}`);
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
        await api.put(`/customers/${id}`, fd);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', fd);
        toast.success('Customer created');
      }
      navigate('/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-4">
        <i className="bi bi-person-plus me-2" />{id ? 'Edit' : 'New'} Customer
      </h5>
      <div className="card shadow-sm" style={{ maxWidth: 700 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center overflow-hidden"
                style={{ width: 100, height: 100 }}>
                {preview
                  ? <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <i className="bi bi-person text-muted" style={{ fontSize: 48 }} />}
              </div>
              <div className="mt-2">
                <label className="btn btn-sm btn-outline-secondary">
                  <i className="bi bi-camera me-1" />Upload Photo
                  <input type="file" accept="image/*" hidden onChange={handleImage} />
                </label>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name *</label>
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
              <div className="col-md-6">
                <label className="form-label">Credit Limit</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input className="form-control" type="number" min="0" step="0.01" value={form.credit_limit}
                    onChange={e => setForm({ ...form, credit_limit: e.target.value })} />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <textarea className="form-control" rows={2} value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-check-lg me-1" />}
                {id ? 'Update' : 'Create'} Customer
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/customers')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
