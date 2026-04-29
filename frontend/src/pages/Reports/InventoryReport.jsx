import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function InventoryReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/reports/inventory');
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('Inventory / Stock Report', 14, 15);
    doc.autoTable({
      startY: 22,
      head: [['Product', 'Barcode', 'Category', 'Stock', 'Min Stock', 'Unit', 'Cost Price', 'Sale Price', 'Stock Value']],
      body: report.data.map(p => [
        p.name, p.barcode || '', p.category_name || '',
        p.stock_qty, p.min_stock, p.unit,
        `₹${Number(p.purchase_price).toFixed(2)}`,
        `₹${Number(p.sale_price).toFixed(2)}`,
        `₹${Number(p.stock_value).toFixed(2)}`
      ]),
    });
    doc.save('inventory-report.pdf');
  };

  if (loading) return <div className="text-center py-5"><span className="spinner-border" /></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0"><i className="bi bi-clipboard-data me-2" />Inventory Report</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
          {report && (
            <button className="btn btn-sm btn-outline-danger" onClick={exportPDF}>
              <i className="bi bi-file-pdf me-1" />Export PDF
            </button>
          )}
        </div>
      </div>

      {report && (
        <>
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Products', val: report.summary.products, color: 'primary' },
              { label: 'Total Units', val: Number(report.summary.total_units || 0).toFixed(0), color: 'info' },
              { label: 'Total Stock Value', val: `₹${Number(report.summary.total_value || 0).toFixed(2)}`, color: 'success' },
              { label: 'Low Stock Items', val: report.summary.low_stock, color: 'danger' },
            ].map((s, i) => (
              <div key={i} className="col-md-3">
                <div className={`card border-${s.color} border-2`}>
                  <div className="card-body text-center">
                    <div className={`fw-bold fs-4 text-${s.color}`}>{s.val}</div>
                    <div className="text-muted small">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Product</th><th>Barcode</th><th>Category</th>
                      <th>Stock</th><th>Min Stock</th><th>Unit</th>
                      <th>Cost Price</th><th>Sale Price</th><th>Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.map(p => (
                      <tr key={p.id} className={Number(p.stock_qty) <= Number(p.min_stock) ? 'table-warning' : ''}>
                        <td className="fw-semibold">{p.name}</td>
                        <td><small className="font-monospace">{p.barcode || '-'}</small></td>
                        <td>{p.category_name || '-'}</td>
                        <td>
                          <span className={`badge ${Number(p.stock_qty) <= Number(p.min_stock) ? 'bg-danger' : 'bg-success'}`}>
                            {p.stock_qty}
                          </span>
                        </td>
                        <td>{p.min_stock}</td>
                        <td>{p.unit}</td>
                        <td>₹{Number(p.purchase_price).toFixed(2)}</td>
                        <td>₹{Number(p.sale_price).toFixed(2)}</td>
                        <td className="fw-semibold">₹{Number(p.stock_value).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan={8} className="text-end">Total Stock Value:</td>
                      <td>₹{Number(report.summary.total_value || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
