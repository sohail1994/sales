import React, { useState } from 'react';

export default function BarcodePrintSheet({ products, onClose }) {
  const [qtys, setQtys] = useState(() => {
    const init = {};
    products.forEach(p => { init[p.id] = p.defaultQty || 1; });
    return init;
  });

  const handlePrint = () => {
    const labels = products.flatMap(p =>
      Array.from({ length: Number(qtys[p.id]) || 1 }, () => p)
    );

    const labelsHtml = labels.map(p => {
      const name = p.name.length > 22 ? p.name.slice(0, 20) + '\u2026' : p.name;
      const safeName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const barcodeUrl = `http://localhost:5000/api/products/${encodeURIComponent(p.barcode)}/barcode-image`;
      const mrp = Number(p.sale_price).toFixed(2);
      return `
        <div class="label">
          <div class="name">${safeName}</div>
          <img src="${barcodeUrl}" alt="${p.barcode}" />
          <div class="mrp">MRP: &#8377;${mrp}</div>
        </div>`;
    }).join('');

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Allow pop-ups to print labels.'); return; }

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Barcode Labels</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }
    .sheet { display: flex; flex-wrap: wrap; }
    .label {
      width: 63.5mm; height: 38.1mm;
      border: 0.3mm solid #ccc;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 2mm; overflow: hidden;
      page-break-inside: avoid;
    }
    .name {
      font-size: 9pt; font-weight: 600; text-align: center;
      margin-bottom: 1mm; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 59mm;
    }
    img { max-width: 100%; max-height: 18mm; object-fit: contain; }
    .mrp { font-size: 10pt; font-weight: 700; margin-top: 1mm; }
    @media print {
      .label { border-color: transparent; }
      @page { margin: 5mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">${labelsHtml}</div>
  <script>
    var imgs = document.querySelectorAll('img');
    var loaded = 0;
    function tryPrint() {
      loaded++;
      if (loaded >= imgs.length) { window.print(); window.close(); }
    }
    if (imgs.length === 0) { window.print(); window.close(); }
    else { imgs.forEach(function(img) {
      if (img.complete) { tryPrint(); }
      else { img.onload = tryPrint; img.onerror = tryPrint; }
    }); }
  <\/script>
</body>
</html>`);
    win.document.close();
  };

  const totalLabels = products.reduce((s, p) => s + (Number(qtys[p.id]) || 1), 0);

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-md">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-bold">
              <i className="bi bi-upc-scan me-2" />Print Barcode Labels
            </h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="text-muted small mb-3">
              Set how many label copies to print for each product.
            </p>
            <table className="table table-sm align-middle mb-3">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th style={{ width: 90 }}>Copies</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {p.name}
                      </div>
                      <small className="text-muted">MRP: ₹{Number(p.sale_price).toFixed(2)}</small>
                    </td>
                    <td><small className="font-monospace">{p.barcode}</small></td>
                    <td>
                      <input
                        type="number" min="1" max="100"
                        className="form-control form-control-sm"
                        value={qtys[p.id] || 1}
                        onChange={e =>
                          setQtys(prev => ({ ...prev, [p.id]: Math.max(1, Number(e.target.value)) }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-muted small">
              Total labels: <strong>{totalLabels}</strong>
              &nbsp;· Label size: 63.5 × 38.1 mm &nbsp;· 3 per row on A4
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <i className="bi bi-printer me-1" />Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
