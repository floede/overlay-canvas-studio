const MARGIN = 24;
const BOX_PADDING = 16;
const BOX_RADIUS = 8;

export function defaultCenterBoxData() {
  return {
    headline: 'Your message',
  };
}

export function drawCenterBox(ctx, data, width, height, theme) {
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
  const headlineLineHeight = theme.fontSizeHeadline * 1.15;

  const contentHeight = headlineLines.length * headlineLineHeight;

  return {
    innerW,
    headlineLines,
    headlineLineHeight,
    height: BOX_PADDING * 2 + contentHeight,
  };
}

function drawBox(ctx, x, y, w, layout, theme) {
  const { innerW, headlineLines, headlineLineHeight, height } = layout;

  roundRect(ctx, x, y, w, height, BOX_RADIUS);
  ctx.fillStyle = theme['color-box-bg'];
  ctx.fill();

  const innerX = x + BOX_PADDING;
  const textX = innerX + innerW / 2;
  let cursorY = y + BOX_PADDING;

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillStyle = theme['color-headline'];
  ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;

  for (const line of headlineLines) {
    ctx.fillText(line, textX, cursorY);
    cursorY += headlineLineHeight;
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
