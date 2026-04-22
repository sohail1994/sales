import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const load = useCallback(async () => {
    const { data } = await api.get('/products', {
      params: { search, category_id: categoryId, low_stock: lowStock, page, limit: LIMIT }
    });
    setProducts(data.data);
    setTotal(data.total);
  }, [search, categoryId, lowStock, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data)); }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product deleted');
    load();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0"><i className="bi bi-box-seam me-2" />Products</h5>
        <Link to="/products/new" className="btn btn-primary btn-sm">
          <i className="bi bi-plus me-1" />Add Product
        </Link>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search" /></span>
                <input className="form-control" placeholder="Name, barcode, SKU…"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={categoryId}
                onChange={e => { setCategoryId(e.target.value); setPage(1); }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-center">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="lowStock"
                  checked={lowStock} onChange={e => { setLowStock(e.target.checked); setPage(1); }} />
                <label className="form-check-label text-danger" htmlFor="lowStock">Low Stock Only</label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Image</th><th>Name</th><th>Barcode</th><th>Category</th>
                  <th>Purchase</th><th>Sale</th><th>Stock</th><th>Min Stock</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className={p.stock_qty <= p.min_stock ? 'table-warning' : ''}>
                    <td>
                      {p.image
                        ? <img src={`http://localhost:5000${p.image}`} alt={p.name}
                            style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: 6 }} />
                        : <div className="bg-light rounded d-flex align-items-center justify-content-center"
                            style={{ width: 45, height: 45 }}>
                            <i className="bi bi-image text-muted" />
                          </div>}
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      {p.sku && <div><small className="text-muted">SKU: {p.sku}</small></div>}
                    </td>
                    <td>
                      <small className="font-monospace">{p.barcode}</small>
                      <br />
                      <a href={`http://localhost:5000/api/products/${p.barcode}/barcode-image`}
                         target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-secondary"
                         style={{ fontSize: 11, padding: '0 5px' }}>
                        <i className="bi bi-upc me-1" />View
                      </a>
                    </td>
                    <td>{p.category_name || '-'}</td>
                    <td>${Number(p.purchase_price).toFixed(2)}</td>
                    <td>${Number(p.sale_price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.stock_qty <= p.min_stock ? 'bg-danger' : 'bg-success'}`}>
                        {p.stock_qty} {p.unit}
                      </span>
                    </td>
                    <td>{p.min_stock} {p.unit}</td>
                    <td>
                      <Link to={`/products/${p.id}/edit`} className="btn btn-sm btn-outline-primary me-1">
                        <i className="bi bi-pencil" />
                      </Link>
                      <button onClick={() => remove(p.id)} className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr><td colSpan={9} className="text-center text-muted py-4">No products found</td></tr>
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
