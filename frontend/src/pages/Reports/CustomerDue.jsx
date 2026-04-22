import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CustomerDue() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/reports/customer-due').then(r => { setData(r.data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Customer Due Report', 14, 15);
    doc.autoTable({
      startY: 22,
      head: [['Customer', 'Phone', 'Invoices', 'Total Amount', 'Due Amount']],
      body: data.map(c => [c.name, c.phone||'-', c.total_invoices,
        `$${Number(c.total_amount).toFixed(2)}`,
        `$${Number(c.due_amount).toFixed(2)}`
      ]),
    });
    doc.save('customer-due-report.pdf');
  };

  const total = data.reduce((s, c) => s + Number(c.due_amount), 0);

  if (loading) return <div className="text-center py-5"><span className="spinner-border" /></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0"><i className="bi bi-person-x me-2" />Customer Due Report</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
          <button className="btn btn-sm btn-outline-danger" onClick={exportPDF}>
            <i className="bi bi-file-pdf me-1" />Export PDF
          </button>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card border-danger border-2">
            <div className="card-body text-center">
              <div className="fw-bold fs-4 text-danger">${total.toFixed(2)}</div>
              <div className="text-muted small">Total Outstanding Due</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning border-2">
            <div className="card-body text-center">
              <div className="fw-bold fs-4 text-warning">{data.length}</div>
              <div className="text-muted small">Customers with Due</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th><th>Customer</th><th>Phone</th><th>Email</th>
                  <th>Invoices</th><th>Total Amount</th><th>Due Amount</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.total_invoices}</td>
                    <td>${Number(c.total_amount).toFixed(2)}</td>
                    <td className="text-danger fw-bold">${Number(c.due_amount).toFixed(2)}</td>
                    <td>
                      <Link to={`/customers`} className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!data.length && (
                  <tr><td colSpan={8} className="text-center text-success py-4">
                    <i className="bi bi-check-circle me-2" />No outstanding dues — all customers are clear!
                  </td></tr>
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td colSpan={6} className="text-end">Total Due:</td>
                    <td className="text-danger">${total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
