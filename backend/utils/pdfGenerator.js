const PDFDocument = require('pdfkit');

const col = (x, y, doc, label, value, w = 120) => {
  doc.font('Helvetica-Bold').text(label, x, y);
  doc.font('Helvetica').text(String(value ?? '-'), x + w, y);
};

const fmt = (n) => Number(n || 0).toFixed(2);

/**
 * Stream a Sale invoice PDF into the response object.
 * @param {object} sale   Sale record including .items[]
 * @param {object} res    Express response stream
 */
const generateInvoicePDF = (sale, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ── Header ───────────────────────────────────────────────
  doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text('Shop Management System', { align: 'center' });
  doc.moveDown(1.5);

  // ── Invoice Meta ─────────────────────────────────────────
  const y = doc.y;
  doc.fontSize(10);
  col(50,  y, doc, 'Invoice No:', sale.invoice_no);
  col(300, y, doc, 'Date:', sale.sale_date);
  col(50,  y + 18, doc, 'Customer:', sale.customer_name || 'Walk-in');
  col(300, y + 18, doc, 'Phone:', sale.customer_phone || '-');
  col(50,  y + 36, doc, 'Address:', sale.customer_address || '-');
  col(300, y + 36, doc, 'Payment:', sale.payment_method);
  col(300, y + 54, doc, 'Status:', sale.status?.toUpperCase());

  doc.moveDown(4);

  // ── Items Table ──────────────────────────────────────────
  const tableTop = doc.y + 10;
  const cols = { sn: 50, name: 80, qty: 300, price: 360, disc: 420, total: 480 };

  // Header row
  doc.rect(50, tableTop, 510, 20).fill('#2c3e50');
  doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
  doc.text('#',            cols.sn,   tableTop + 5);
  doc.text('Product',      cols.name, tableTop + 5);
  doc.text('Qty',          cols.qty,  tableTop + 5, { width: 50, align: 'right' });
  doc.text('Unit Price',   cols.price,tableTop + 5, { width: 55, align: 'right' });
  doc.text('Discount',     cols.disc, tableTop + 5, { width: 55, align: 'right' });
  doc.text('Total',        cols.total,tableTop + 5, { width: 60, align: 'right' });
  doc.fillColor('black');

  let rowY = tableTop + 22;
  (sale.items || []).forEach((item, idx) => {
    const bg = idx % 2 === 0 ? '#f8f9fa' : 'white';
    doc.rect(50, rowY, 510, 18).fill(bg);
    doc.font('Helvetica').fontSize(9).fillColor('black');
    doc.text(String(idx + 1),          cols.sn,   rowY + 4);
    doc.text(item.product_name || '-', cols.name, rowY + 4, { width: 215 });
    doc.text(fmt(item.quantity),       cols.qty,  rowY + 4, { width: 50,  align: 'right' });
    doc.text(fmt(item.unit_price),     cols.price,rowY + 4, { width: 55,  align: 'right' });
    doc.text(fmt(item.discount),       cols.disc, rowY + 4, { width: 55,  align: 'right' });
    doc.text(fmt(item.total_price),    cols.total,rowY + 4, { width: 60,  align: 'right' });
    rowY += 18;
  });

  // ── Totals ───────────────────────────────────────────────
  rowY += 8;
  doc.font('Helvetica').fontSize(10);
  const rightX = 400;
  const totalCol = (label, val) => {
    doc.text(label, rightX, rowY, { width: 90, align: 'right' });
    doc.text(`${fmt(val)}`, rightX + 100, rowY, { width: 60, align: 'right' });
    rowY += 16;
  };
  totalCol('Subtotal:', sale.subtotal);
  totalCol('Discount:', sale.discount);
  totalCol('Tax:', sale.tax);

  doc.moveTo(rightX, rowY).lineTo(510, rowY).stroke();
  rowY += 4;
  doc.font('Helvetica-Bold').fontSize(12);
  totalCol('TOTAL:', sale.total_amount);
  doc.font('Helvetica').fontSize(10).fillColor('#27ae60');
  totalCol('Paid:', sale.paid_amount);
  doc.fillColor('#e74c3c');
  totalCol('Due:', sale.due_amount);
  doc.fillColor('black');

  // ── Notes ────────────────────────────────────────────────
  if (sale.notes) {
    rowY += 10;
    doc.font('Helvetica-Bold').text('Notes:', 50, rowY);
    doc.font('Helvetica').text(sale.notes, 50, rowY + 14);
  }

  // ── Footer ───────────────────────────────────────────────
  doc.fontSize(9).fillColor('#7f8c8d')
     .text('Thank you for your business!', 50, doc.page.height - 60, { align: 'center' });

  doc.end();
};

module.exports = { generateInvoicePDF };
