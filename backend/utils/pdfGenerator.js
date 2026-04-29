const PDFDocument = require('pdfkit');

const fmt = (n) => Number(n || 0).toFixed(2);

const generateInvoicePDF = (sale, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
  doc.pipe(res);

  const L = 50;    // left margin
  const W = 495;   // usable width
  let y   = 50;    // vertical cursor

  // How far down we can draw before needing a new page
  // Reserve 50pt bottom margin + 30pt for footer
  const pageBottom = () => doc.page.height - 80;

  const txt = (text, x, cy, opts = {}) => {
    doc.text(String(text ?? '-'), x, cy, { lineBreak: false, ...opts });
  };

  // ── Column positions ─────────────────────────────────────
  const colSn    = L;
  const colName  = L + 22;
  const colQty   = 300;
  const colPrice = 358;
  const colDisc  = 416;
  const colTotal = 474;
  const rowH     = 18;

  const drawTableHeader = () => {
    doc.rect(L, y, W, 20).fill('#2c3e50');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
    txt('#',          colSn,    y + 5);
    txt('Product',    colName,  y + 5, { width: 215 });
    txt('Qty',        colQty,   y + 5, { width: 50,  align: 'right' });
    txt('Unit Price', colPrice, y + 5, { width: 52,  align: 'right' });
    txt('Discount',   colDisc,  y + 5, { width: 52,  align: 'right' });
    txt('Total',      colTotal, y + 5, { width: 56,  align: 'right' });
    doc.fillColor('black');
    y += 22;
  };

  // ── Header ───────────────────────────────────────────────
  doc.fontSize(22).font('Helvetica-Bold');
  txt('INVOICE', L, y, { width: W, align: 'center' });
  y += 28;
  doc.fontSize(10).font('Helvetica');
  txt('Shop Management System', L, y, { width: W, align: 'center' });
  y += 24;

  // ── Divider ──────────────────────────────────────────────
  doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#cccccc').stroke();
  y += 10;

  // ── Invoice Meta (two-column layout) ─────────────────────
  doc.fontSize(10).strokeColor('black');
  const meta = [
    ['Invoice No:', sale.invoice_no,               'Date:',    sale.sale_date],
    ['Customer:',  sale.customer_name || 'Walk-in', 'Phone:',  sale.customer_phone  || '-'],
    ['Address:',   sale.customer_address || '-',   'Payment:', sale.payment_method  || '-'],
    ['Status:',    (sale.status || '').toUpperCase(), '', ''],
  ];
  meta.forEach(([l1, v1, l2, v2]) => {
    doc.font('Helvetica-Bold');   txt(l1, L,       y, { width: 75  });
    doc.font('Helvetica');        txt(v1, L + 78,  y, { width: 150 });
    if (l2) {
      doc.font('Helvetica-Bold'); txt(l2, 300,     y, { width: 70  });
      doc.font('Helvetica');      txt(v2, 375,     y, { width: 170 });
    }
    y += 16;
  });
  y += 10;

  // ── Items Table ──────────────────────────────────────────
  drawTableHeader();

  (sale.items || []).forEach((item, idx) => {
    // Start a new page if this row won't fit
    if (y + rowH > pageBottom()) {
      doc.addPage();
      y = 50;
      drawTableHeader();
    }

    doc.rect(L, y, W, rowH).fill(idx % 2 === 0 ? '#f8f9fa' : 'white');
    doc.font('Helvetica').fontSize(9).fillColor('black');
    txt(idx + 1,                  colSn,    y + 4);
    txt(item.product_name || '-', colName,  y + 4, { width: 215 });
    txt(item.sale_unit_label
          ? `${item.quantity} × ${item.sale_unit_label}`
          : fmt(item.quantity),   colQty,   y + 4, { width: 50,  align: 'right' });
    txt(fmt(item.unit_price),     colPrice, y + 4, { width: 52,  align: 'right' });
    txt(fmt(item.discount),       colDisc,  y + 4, { width: 52,  align: 'right' });
    txt(fmt(item.total_price),    colTotal, y + 4, { width: 56,  align: 'right' });
    y += rowH;
  });

  y += 10;

  // ── Totals ───────────────────────────────────────────────
  // If totals block (~120pt) + footer won't fit, push to a new page
  if (y + 120 > pageBottom()) {
    doc.addPage();
    y = 50;
  }

  const tLblX = 370;
  const tValX = 455;
  const tLblW = 80;
  const tValW = 60;

  const totalRow = (label, val, bold = false, color = 'black') => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 10).fillColor(color);
    txt(label,    tLblX, y, { width: tLblW, align: 'right' });
    txt(fmt(val), tValX, y, { width: tValW, align: 'right' });
    y += bold ? 18 : 15;
  };

  totalRow('Subtotal:', sale.subtotal);
  totalRow('Discount:', sale.discount);
  totalRow('Tax:',      sale.tax);
  doc.moveTo(tLblX, y).lineTo(tValX + tValW, y).strokeColor('#333').lineWidth(0.5).stroke();
  y += 4;
  totalRow('TOTAL:', sale.total_amount, true);
  totalRow('Paid:',  sale.paid_amount,  false, '#27ae60');
  totalRow('Due:',   sale.due_amount,   false, '#e74c3c');
  doc.fillColor('black').lineWidth(1);

  // ── Notes ────────────────────────────────────────────────
  if (sale.notes) {
    y += 8;
    doc.font('Helvetica-Bold').fontSize(10);
    txt('Notes:', L, y);
    y += 14;
    doc.font('Helvetica').text(sale.notes, L, y, { width: W, lineBreak: true });
    y += doc.heightOfString(sale.notes, { width: W }) + 8;
  }

  doc.end();
};

module.exports = { generateInvoicePDF };
