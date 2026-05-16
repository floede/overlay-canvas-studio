const MARGIN = 24;
const BOX_GAP = 16;
const BOX_PADDING = 16;
const BOX_RADIUS = 12;
const HEADLINE_GAP = 8;

export function defaultTwoBoxData() {
  return {
    box1: {
      headline: 'First insight',
      text: 'Short supporting copy for the first point in your overlay.',
    },
    box2: {
      headline: 'Second insight',
      text: 'Additional context appears here. Edit text in the admin panel.',
    },
  };
}

export function drawTwoBoxText(ctx, data, width, height, theme) {
  const contentTop = MARGIN;
  const contentHeight = height - MARGIN * 2;
  const boxWidth = width - MARGIN * 2;
  const boxHeight = (contentHeight - BOX_GAP) / 2;

  drawBox(ctx, data.box1, MARGIN, contentTop, boxWidth, boxHeight, theme);
  drawBox(
    ctx,
    data.box2,
    MARGIN,
    contentTop + boxHeight + BOX_GAP,
    boxWidth,
    boxHeight,
    theme,
  );
}

function drawBox(ctx, box, x, y, w, h, theme) {
  roundRect(ctx, x, y, w, h, BOX_RADIUS);
  ctx.fillStyle = theme['color-box-bg'];
  ctx.fill();
  ctx.strokeStyle = theme['color-box-border'];
  ctx.lineWidth = 2;
  ctx.stroke();

  const innerX = x + BOX_PADDING;
  const innerY = y + BOX_PADDING;
  const innerW = w - BOX_PADDING * 2;

  ctx.fillStyle = theme['color-headline'];
  ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;
  const headlineLines = wrapText(ctx, box.headline ?? '', innerW);
  let cursorY = innerY + theme.fontSizeHeadline;

  for (const line of headlineLines) {
    ctx.fillText(line, innerX, cursorY);
    cursorY += theme.fontSizeHeadline * 1.15;
  }

  cursorY += HEADLINE_GAP;

  ctx.fillStyle = theme['color-body'];
  ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
  const bodyLines = wrapText(ctx, box.text ?? '', innerW);
  const lineHeight = theme.fontSizeBody * 1.35;

  for (const line of bodyLines) {
    if (cursorY > y + h - BOX_PADDING) break;
    ctx.fillText(line, innerX, cursorY);
    cursorY += lineHeight;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

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
