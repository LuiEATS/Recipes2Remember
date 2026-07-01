export async function generateShoppingListPDF(selected, orderedCats, grouped, formatDisplay) {
  if (!window.jspdf) throw new Error('jsPDF not loaded');
  const { jsPDF } = window.jspdf;

  const DENIM = [45, 74, 122];
  const RED   = [184, 41, 26];
  const CREAM = [245, 240, 232];
  const BROWN = [107, 76, 42];
  const INK   = [26, 22, 18];
  const LGRAY = [220, 213, 200];

  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const W = 215.9;
  const margin = 14;
  const col = W - margin * 2;
  let y = 0;

  function addHeader() {
    doc.setFillColor(...DENIM);
    doc.rect(0, 0, W, 22, 'F');
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(18);
    doc.setTextColor(...CREAM);
    doc.text('Recipes2Remember', margin, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 200, 230);
    doc.text('Homemade · Handed Down · Never Forgotten', W - margin, 14, { align: 'right' });
    doc.setFillColor(...RED);
    doc.rect(0, 22, W, 1.2, 'F');
    y = 23.2;
  }

  function addFooter() {
    const curr = doc.internal.getCurrentPageInfo().pageNumber;
    const total = doc.internal.getNumberOfPages();
    doc.setFillColor(...RED);
    doc.rect(0, 272, W, 0.8, 'F');
    doc.setFillColor(...DENIM);
    doc.rect(0, 272.8, W, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CREAM);
    doc.text('Recipes2Remember · Every dish has a story. Write yours down.', margin, 279);
    doc.text('Page ' + curr + ' of ' + total, W - margin, 279, { align: 'right' });
  }

  function addPageIfNeeded(needed = 20) {
    if (y + needed > 265) {
      addFooter();
      doc.addPage();
      y = 0;
      addHeader();
    }
  }

  addHeader();

  // Title
  y += 8;
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...DENIM);
  doc.text("Shoppin' List", margin, y);
  y += 8;

  // From line
  const names = selected.map(r => r.title).join(' · ');
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...BROWN);
  doc.text('From: ' + names, margin, y);
  y += 6;

  // Red rule
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + col, y);
  y += 8;

  // Categories
  orderedCats.forEach(cat => {
    const items = grouped[cat.key] || [];
    if (!items.length) return;

    addPageIfNeeded(14);

    // Parse color
    const hex = cat.color.replace('#', '');
    const cr = parseInt(hex.substring(0,2), 16);
    const cg = parseInt(hex.substring(2,4), 16);
    const cb = parseInt(hex.substring(4,6), 16);

    // Category header
    doc.setFillColor(cr, cg, cb);
    doc.rect(margin, y, col, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(cat.icon + '  ' + cat.label.toUpperCase() + '  (' + items.length + ')', margin + 4, y + 5.5);
    y += 10;

    // Items in 2 columns
    const half = Math.ceil(items.length / 2);
    const colW = (col - 6) / 2;

    items.forEach((item, i) => {
      const isRight = i >= half;
      const row = isRight ? i - half : i;
      const startX = isRight ? margin + colW + 6 : margin;
      const rowY = y + row * 9;
      addPageIfNeeded(10);

      // Checkbox
      doc.setDrawColor(cr, cg, cb);
      doc.setLineWidth(0.5);
      doc.rect(startX, rowY, 4, 4);

      // Amount
      const display = formatDisplay(item);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(cr, cg, cb);
      doc.text(display, startX + 6, rowY + 3.5);

      // Name
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...INK);
      doc.text(item.name, startX + 6 + doc.getTextWidth(display) + 2, rowY + 3.5);
    });

    y += Math.ceil(items.length / 2) * 9 + 6;
  });

  addFooter();
  doc.save('Shopping_List.pdf');
}
