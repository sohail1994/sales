import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    const { data } = await api.get('/customers', { params: { search, page, limit: LIMIT } });
    setCustomers(data.data);
    setTotal(data.total);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    toast.success('Customer deleted');
    load();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-people me-2" />Customers</h5>
        <Link to="/customers/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus me-1" />Add Customer
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="input-group mb-3" style={{ maxWidth: 400 }}>
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input className="form-control" placeholder="Search name, phone, email…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Photo</th><th>Name</th><th>Phone</th><th>Email</th>
                  <th>Balance</th><th>Credit Limit</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      {c.image
                        ? <img src={`http://localhost:5000${c.image}`} alt={c.name}
                            className="rounded-circle" width={40} height={40} style={{ objectFit: 'cover' }} />
                        : <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                            style={{ width: 40, height: 40 }}>
                            {c.name[0].toUpperCase()}
                          </div>}
                    </td>
                    <td><strong>{c.name}</strong><br /><small className="text-muted">{c.address}</small></td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>
                      <span className={`fw-semibold ${Number(c.balance) > 0 ? 'text-danger' : 'text-success'}`}>
                        ₹{Number(c.balance).toFixed(2)}
                      </span>
                    </td>
                    <td>₹{Number(c.credit_limit).toFixed(2)}</td>
                    <td>
                      <Link to={`/customers/${c.id}/edit`} className="btn btn-sm btn-outline-primary me-1">
                        <i className="bi bi-pencil" />
                      </Link>
                      <button onClick={() => remove(c.id)} className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!customers.length && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No customers found</td></tr>
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
    </div>
  );
}
