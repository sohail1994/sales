import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const StatusBadge = ({ s }) => {
  const map = { paid:'bg-success', partial:'bg-warning text-dark', pending:'bg-danger', cancelled:'bg-secondary' };
  return <span className={`badge ${map[s] || 'bg-secondary'}`}>{s}</span>;
};

export default function SaleList() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    const { data } = await api.get('/sales', { params: { search, status, from, to, page, limit: LIMIT } });
    setSales(data.data);
    setTotal(data.total);
  }, [search, status, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this sale? Stock will be restored.')) return;
    await api.put(`/sales/${id}/cancel`);
    toast.success('Sale cancelled');
    load();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-cart-check me-2" />Sales</h5>
        <Link to="/sales/new" className="btn btn-success btn-sm">
          <i className="bi bi-plus me-1" />New Sale
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-3">
              <input className="form-control" placeholder="Invoice / Customer…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-2">
              <input className="form-control" type="date" value={from}
                onChange={e => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <input className="form-control" type="date" value={to}
                onChange={e => { setTo(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Invoice</th><th>Date</th><th>Customer</th>
                  <th>Total</th><th>Paid</th><th>Due</th><th>Payment</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td><Link to={`/sales/${s.id}`} className="fw-semibold text-primary">{s.invoice_no}</Link></td>
                    <td>{s.sale_date}</td>
                    <td>{s.customer_name || <em className="text-muted">Walk-in</em>}</td>
                    <td>${Number(s.total_amount).toFixed(2)}</td>
                    <td className="text-success">${Number(s.paid_amount).toFixed(2)}</td>
                    <td className={Number(s.due_amount) > 0 ? 'text-danger fw-semibold' : ''}>
                      ${Number(s.due_amount).toFixed(2)}
                    </td>
                    <td className="text-capitalize">{s.payment_method}</td>
                    <td><StatusBadge s={s.status} /></td>
                    <td>
                      <Link to={`/sales/${s.id}`} className="btn btn-sm btn-outline-primary me-1">
                        <i className="bi bi-eye" />
                      </Link>
                      <a href={`http://localhost:5000/api/sales/${s.id}/invoice-pdf`}
                         target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary me-1">
                        <i className="bi bi-file-pdf" />
                      </a>
                      {s.status !== 'cancelled' && (
                        <button onClick={() => cancel(s.id)} className="btn btn-sm btn-outline-danger">
                          <i className="bi bi-x-circle" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!sales.length && (
                  <tr><td colSpan={9} className="text-center text-muted py-4">No sales found</td></tr>
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
