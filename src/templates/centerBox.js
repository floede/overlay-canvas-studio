const MARGIN = 24;
const BOX_PADDING = 48;
const BOX_RADIUS = 8;
const LINE_GAP = 8;

export function defaultCenterBoxData() {
  return {
    headline: 'Your message',
  };
}

export function drawCenterBox(ctx, data, width, height, theme, animationContext = null) {
  const headline = String(data?.headline ?? '').trim();
  if (!headline) return;

  const boxWidth = width - MARGIN * 2;
  const layout = measureBox(ctx, headline, boxWidth, theme);
  if (layout.height <= 0) return;

  const x = MARGIN;
  const y = (height - layout.height) / 2;
  drawBox(ctx, x, y, boxWidth, layout, theme);
}

function measureBox(ctx, headline, w, theme) {
  const innerW = Math.max(0, w - BOX_PADDING * 2);

  ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;
  const headlineLines = wrapText(ctx, headline.toUpperCase(), innerW);
  const lineMetrics = headlineLines.map((line) => getLineMetrics(ctx, line, theme.fontSizeHeadline));
  const contentHeight = blockHeight(lineMetrics, LINE_GAP);

  return {
    innerW,
    headlineLines,
    lineMetrics,
    contentHeight,
    height: BOX_PADDING * 2 + contentHeight,
  };
}

function getLineMetrics(ctx, line, fontSize) {
  const m = ctx.measureText(line);
  // Add significant extra headroom for accented characters (É, Ó, etc.)
  // Using actualBoundingBoxAscent when available, otherwise generous fallback
  const ascent = m.actualBoundingBoxAscent ?? fontSize * 1.0;
  const descent = m.actualBoundingBoxDescent ?? fontSize * 0.3;
  return { ascent, descent, height: ascent + descent };
}

function blockHeight(lineMetrics, gap) {
  if (lineMetrics.length === 0) return 0;
  let height = lineMetrics.reduce((sum, line) => sum + line.height, 0);
  height += gap * (lineMetrics.length - 1);
  return height;
}

function drawBox(ctx, x, y, w, layout, theme) {
  const { innerW, headlineLines, lineMetrics, height } = layout;

  roundRect(ctx, x, y, w, height, BOX_RADIUS);
  ctx.fillStyle = theme['color-box-bg'];
  ctx.fill();

  const innerX = x + BOX_PADDING;
  const textX = innerX + innerW / 2;
  let cursorY = y + BOX_PADDING;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = theme['color-headline'];
  ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;

  for (let i = 0; i < headlineLines.length; i++) {
    const line = headlineLines[i];
    const { ascent, descent, height: lineHeight } = lineMetrics[i];
    ctx.fillText(line, textX, cursorY + ascent);
    cursorY += lineHeight + (i < headlineLines.length - 1 ? LINE_GAP : 0);
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  if (maxWidth <= 0) return [];

  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines = [];
  let line = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = `${line} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}
