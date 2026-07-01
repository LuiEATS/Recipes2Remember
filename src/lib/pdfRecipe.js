export async function generateRecipePDF(recipe) {
  if (!window.jspdf) throw new Error('jsPDF not loaded');
  const { jsPDF } = window.jspdf;

  const DENIM  = [45, 74, 122];
  const RED    = [184, 41, 26];
  const CREAM  = [245, 240, 232];
  const BROWN  = [107, 76, 42];
  const INK    = [26, 22, 18];
  const LGRAY  = [220, 213, 200];

  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const W = 215.9;
  const margin = 14;
  const col = W - margin * 2;
  let y = 0;

  function addPageIfNeeded(needed = 20) {
    if (y + needed > 265) {
      addFooter();
      doc.addPage();
      y = 0;
      addHeader();
    }
  }

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
    const totalPages = doc.internal.getNumberOfPages();
    const curr = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFillColor(...RED);
    doc.rect(0, 272, W, 0.8, 'F');
    doc.setFillColor(...DENIM);
    doc.rect(0, 272.8, W, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CREAM);
    doc.text('Recipes2Remember · Every dish has a story. Write yours down.', margin, 279);
    doc.text('Page ' + curr + ' of ' + totalPages, W - margin, 279, { align: 'right' });
  }

  addHeader();

  // Hero image
  if (recipe.image_url) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = recipe.image_url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      doc.addImage(dataUrl, 'JPEG', 0, y, W, 58);
      y += 58;
    } catch (e) {
      // skip image on error
    }
  }

  // Title block
  y += 4;
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...LGRAY);
  doc.roundedRect(margin, y, col, 28, 2, 2, 'FD');
  doc.setFillColor(...DENIM);
  doc.rect(margin, y, 4, 28, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...DENIM);
  doc.text(recipe.title || 'Untitled', margin + 8, y + 10);
  if (recipe.description) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...BROWN);
    const descLines = doc.splitTextToSize(recipe.description, col - 12);
    doc.text(descLines.slice(0, 2), margin + 8, y + 19);
  }
  y += 34;

  // Quick stats
  const stats = [
    { label: 'PREP', val: recipe.prep_time || '--' },
    { label: 'COOK', val: recipe.cook_time || '--' },
    { label: 'SERVES', val: String(recipe.servings || '--') },
    { label: 'BY', val: recipe.author || '--' },
  ];
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...LGRAY);
  doc.roundedRect(margin, y, col, 16, 2, 2, 'FD');
  const sw = col / 4;
  stats.forEach((s, i) => {
    const cx = margin + sw * i + sw / 2;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DENIM);
    doc.text(s.val, cx, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...BROWN);
    doc.text(s.label, cx, y + 13, { align: 'center' });
    if (i < 3) {
      doc.setDrawColor(...LGRAY);
      doc.line(margin + sw * (i + 1), y + 3, margin + sw * (i + 1), y + 13);
    }
  });
  y += 20;

  // Tags
  if (recipe.tags && recipe.tags.length) {
    let tx = margin;
    recipe.tags.forEach(tag => {
      const tw = doc.getTextWidth(tag) + 8;
      if (tx + tw > W - margin) { y += 8; tx = margin; }
      doc.setFillColor(...DENIM);
      doc.roundedRect(tx, y, tw, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...CREAM);
      doc.text(tag, tx + 4, y + 4.2);
      tx += tw + 4;
    });
    y += 10;
  }

  // Section header helper
  function sectionHeader(title) {
    addPageIfNeeded(12);
    y += 4;
    doc.setFillColor(...DENIM);
    doc.rect(margin, y, col, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...CREAM);
    doc.text(title, W / 2, y + 5.5, { align: 'center' });
    y += 12;
  }

  // Ingredients
  sectionHeader('✦ INGREDIENTS ✦');
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const half = Math.ceil(ings.length / 2);
  const colW = (col - 6) / 2;
  ings.forEach((ing, i) => {
    const col1 = i < half;
    const row = col1 ? i : i - half;
    const startX = col1 ? margin : margin + colW + 6;
    const rowY = y + row * 9;
    addPageIfNeeded(10);
    if (row % 2 === 0) {
      doc.setFillColor(245, 240, 232);
      doc.rect(startX, rowY - 2, colW, 8, 'F');
    }
    doc.setFillColor(...RED);
    doc.circle(startX + 2, rowY + 2, 1, 'F');
    const amt = ing.amount ? `${ing.amount} ${ing.unit || ''}`.trim() : '';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...RED);
    doc.text(amt, startX + 6, rowY + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(ing.name || '', startX + 6 + doc.getTextWidth(amt) + 2, rowY + 3.5);
  });
  y += Math.ceil(ings.length / 2) * 9 + 4;

  // Steps
  sectionHeader('✦ DIRECTIONS ✦');
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
  steps.forEach((step, i) => {
    addPageIfNeeded(18);
    // Circle number
    doc.setFillColor(...RED);
    doc.circle(margin + 4, y + 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1), margin + 4, y + 5.5, { align: 'center' });
    // Step text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(step.text || '', col - 14);
    doc.text(lines, margin + 12, y + 4.5);
    y += lines.length * 5.5 + 6;
    if (i < steps.length - 1) {
      doc.setDrawColor(...LGRAY);
      doc.line(margin, y, margin + col, y);
      y += 3;
    }
  });

  // Nutrition
  const nf = recipe.nutrition_facts || {};
  if (Object.keys(nf).length) {
    sectionHeader('✦ NUTRITION FACTS (PER SERVING) ✦');
    addPageIfNeeded(24);
    const nutrients = [
      { key: 'calories', label: 'CALORIES' },
      { key: 'protein', label: 'PROTEIN' },
      { key: 'carbs', label: 'CARBS' },
      { key: 'fat', label: 'FAT' },
      { key: 'fiber', label: 'FIBER' },
    ];
    const nw = col / 5;
    nutrients.forEach((n, i) => {
      const nx = margin + nw * i;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...LGRAY);
      doc.roundedRect(nx, y, nw - 2, 20, 2, 2, 'FD');
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...DENIM);
      doc.text(String(nf[n.key] || 0), nx + nw / 2 - 1, y + 12, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...BROWN);
      doc.text(n.label, nx + nw / 2 - 1, y + 18, { align: 'center' });
    });
    y += 24;
  }

  addFooter();

  const safeName = (recipe.title || 'Recipe').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeName}_recipe.pdf`);
}
