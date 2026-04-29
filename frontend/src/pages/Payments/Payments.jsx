import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    const { data } = await api.get('/payments', {
      params: { reference_type: type, from, to, page, limit: LIMIT }
    });
    setPayments(data.data);
    setTotal(data.total);
  }, [type, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / LIMIT);
  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <h5 className="fw-bold mb-4"><i className="bi bi-cash-stack me-2" />Payment History</h5>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={type}
                onChange={e => { setType(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="sale">Sales</option>
                <option value="purchase">Purchases</option>
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={from}
                onChange={e => { setFrom(e.target.value); setPage(1); }} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={to}
                onChange={e => { setTo(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="alert alert-info py-2 mb-3">
            <strong>Showing {payments.length} records</strong> — Total Collected: <strong>₹{totalAmount.toFixed(2)}</strong>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th><th>Type</th><th>Ref ID</th><th>Amount</th>
                  <th>Method</th><th>Date</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id}>
                    <td>{(page - 1) * LIMIT + i + 1}</td>
                    <td>
                      <span className={`badge ${p.method === 'cash' ? 'bg-success' : p.method === 'credit' ? 'bg-warning text-dark' : 'bg-info'}`}>
                        {p.reference_type}
                      </span>
                    </td>
                    <td>#{p.reference_id}</td>
                    <td className="fw-semibold text-success">₹{Number(p.amount).toFixed(2)}</td>
                    <td className="text-capitalize">{p.payment_method}</td>
                    <td>{p.payment_date}</td>
                    <td>{p.notes || '-'}</td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <nav>
              <ul className="pagination pagination-sm justify-content-end">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${pg === page ? 'active' : ''}`}>
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
