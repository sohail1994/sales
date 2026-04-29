import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];

export default function PaymentReminders() {
  const [reminders, setReminders] = useState([]);
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ customer_id: '', sale_id: '', amount: 0, due_date: today(), message: '' });

  const load = useCallback(async () => {
    const { data } = await api.get('/payments/reminders', { params: { status } });
    setReminders(data);
  }, [status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/customers', { params: { limit: 200 } }).then(r => setCustomers(r.data.data));
  }, []);

  const loadCustomerSales = async (customerId) => {
    if (!customerId) { setSales([]); return; }
    const { data } = await api.get('/sales', {
      params: { customer_id: customerId, status: 'partial', limit: 50 }
    });
    setSales(data.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/reminders', form);
      toast.success('Reminder created');
      setShowModal(false);
      setForm({ customer_id: '', sale_id: '', amount: 0, due_date: today(), message: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const updateStatus = async (id, newStatus) => {
    await api.put(`/payments/reminders/${id}`, { status: newStatus });
    toast.success('Status updated');
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete reminder?')) return;
    await api.delete(`/payments/reminders/${id}`);
    toast.success('Reminder deleted');
    load();
  };

  const overdue = (dateStr) => new Date(dateStr) < new Date(today());

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-bell me-2" />Payment Reminders</h5>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus me-1" />New Reminder
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="mb-3">
            <select className="form-select" style={{ maxWidth: 200 }} value={status}
              onChange={e => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Customer</th><th>Phone</th><th>Invoice</th>
                  <th>Amount</th><th>Due Date</th><th>Status</th><th>Message</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map(r => (
                  <tr key={r.id} className={overdue(r.due_date) && r.status === 'pending' ? 'table-danger' : ''}>
                    <td><strong>{r.customer_name || '-'}</strong></td>
                    <td>{r.customer_phone || '-'}</td>
                    <td>{r.invoice_no || '-'}</td>
                    <td className="fw-semibold text-danger">₹{Number(r.amount).toFixed(2)}</td>
                    <td>
                      {r.due_date}
                      {overdue(r.due_date) && r.status === 'pending' && (
                        <span className="badge bg-danger ms-1">OVERDUE</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'paid' ? 'bg-success' : r.status === 'sent' ? 'bg-info' : 'bg-warning text-dark'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td><small>{r.message || '-'}</small></td>
                    <td>
                      {r.status === 'pending' && (
                        <button className="btn btn-xs btn-outline-info me-1"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => updateStatus(r.id, 'sent')}>
                          Mark Sent
                        </button>
                      )}
                      {r.status !== 'paid' && (
                        <button className="btn btn-xs btn-outline-success me-1"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => updateStatus(r.id, 'paid')}>
                          Mark Paid
                        </button>
                      )}
                      <button className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(r.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!reminders.length && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No reminders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">New Payment Reminder</h6>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Customer *</label>
                    <select className="form-select" required value={form.customer_id}
                      onChange={e => {
                        setForm({ ...form, customer_id: e.target.value, sale_id: '' });
                        loadCustomerSales(e.target.value);
                      }}>
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>
                  {sales.length > 0 && (
                    <div className="col-12">
                      <label className="form-label">Related Invoice (Optional)</label>
                      <select className="form-select" value={form.sale_id}
                        onChange={e => {
                          const sale = sales.find(s => s.id === Number(e.target.value));
                          setForm({ ...form, sale_id: e.target.value,
                            amount: sale ? sale.due_amount : form.amount });
                        }}>
                        <option value="">-- Select Invoice --</option>
                        {sales.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.invoice_no} — Due: ₹{Number(s.due_amount).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">Amount *</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input type="number" className="form-control" min="0.01" step="0.01" required
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Due Date *</label>
                    <input type="date" className="form-control" required value={form.due_date}
                      onChange={e => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message</label>
                    <textarea className="form-control" rows={3} placeholder="Reminder message…"
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Create Reminder</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
