import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const StatusBadge = ({ s }) => {
  const map = { paid:'bg-success', partial:'bg-warning text-dark', pending:'bg-danger' };
  return <span className={`badge ${map[s] || 'bg-secondary'}`}>{s}</span>;
};

export default function PurchaseList() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    const { data } = await api.get('/purchases', { params: { search, status, page, limit: LIMIT } });
    setPurchases(data.data);
    setTotal(data.total);
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-bag-plus me-2" />Purchases</h5>
        <Link to="/purchases/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus me-1" />New Purchase
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <input className="form-control" placeholder="Invoice / Supplier…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Invoice</th><th>Date</th><th>Supplier</th>
                  <th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/purchases/${p.id}`} className="fw-semibold text-primary">{p.invoice_no}</Link>
                    </td>
                    <td>{p.purchase_date}</td>
                    <td>{p.supplier_name || '-'}</td>
                    <td>${Number(p.total_amount).toFixed(2)}</td>
                    <td className="text-success">${Number(p.paid_amount).toFixed(2)}</td>
                    <td className={Number(p.due_amount) > 0 ? 'text-danger fw-semibold' : ''}>
                      ${Number(p.due_amount).toFixed(2)}
                    </td>
                    <td><StatusBadge s={p.status} /></td>
                    <td>
                      <Link to={`/purchases/${p.id}`} className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!purchases.length && (
                  <tr><td colSpan={8} className="text-center text-muted py-4">No purchases found</td></tr>
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
