const MARGIN_VERTICAL = 48;
const MARGIN_HORIZONTAL = 24;
const BOX_PADDING = 16;
const BOX_RADIUS = 8;
const HEADLINE_GAP = 8;
const CIRCLE_SIZE = 64;
const CIRCLE_GAP = 12;

export function defaultTwoBoxData() {
  return {
    box1: {
      headline: 'First insight',
      text: 'Short supporting copy for the first point in your overlay.',
    },
    box2: {
      headline: 'Second insight',
      text: 'Additional context appears here. Edit text in the admin panel.',
      percentage: '',
    },
  };
}

export function drawTwoBoxText(ctx, data, width, height, theme, animationContext = null) {
  const boxWidth = width - MARGIN_HORIZONTAL * 2;

  const layout1 = measureBox(ctx, normalizeBox(data?.box1), boxWidth, theme);
  if (layout1.height > 0) {
    drawBox(ctx, MARGIN_HORIZONTAL, MARGIN_VERTICAL, boxWidth, layout1, theme, { centerText: true });
  }

  const layout2 = measureBox(ctx, normalizeBox(data?.box2), boxWidth, theme);
  if (layout2.height > 0) {
    const y2 = height - MARGIN_VERTICAL - layout2.height;
    drawBox(ctx, MARGIN_HORIZONTAL, y2, boxWidth, layout2, theme, { animationContext });
  }
}

function normalizeBox(box) {
  if (!box || typeof box !== 'object') {
    return { headline: '', text: '', percentage: '' };
  }
  return {
    headline: box.headline ?? '',
    text: box.text ?? '',
    percentage: box.percentage ?? '',
  };
}

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function hasContent(box) {
  return hasText(box.headline) || hasText(box.text) || hasPercentage(box);
}

function hasPercentage(box) {
  const val = parseFloat(box.percentage);
  return !isNaN(val) && val >= 0 && val <= 100;
}

function measureBox(ctx, box, w, theme) {
  if (!hasContent(box)) {
    return emptyLayout();
  }

  const innerW = Math.max(0, w - BOX_PADDING * 2);
  const showCircle = hasPercentage(box);
  
  // If showing circle, reduce text width
  const textWidth = showCircle ? innerW - CIRCLE_SIZE - CIRCLE_GAP : innerW;

  ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;
  const headlineLines = hasText(box.headline)
    ? wrapText(ctx, capitalizeHeadline(box.headline), textWidth)
    : [];
  const headlineLineHeight = theme.fontSizeHeadline * 1.3;

  ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
  const bodyLines = hasText(box.text) ? wrapText(ctx, box.text, textWidth) : [];
  const bodyLineHeight = theme.fontSizeBody * 1.4;

  const textContentHeight = measureContentHeight(
    headlineLines,
    bodyLines,
    headlineLineHeight,
    bodyLineHeight,
  );
  
  // If showing circle, content height is the max of text height and circle height
  const contentHeight = showCircle 
    ? Math.max(textContentHeight, CIRCLE_SIZE)
    : textContentHeight;

  return {
    innerW,
    headlineLines,
    bodyLines,
    headlineLineHeight,
    bodyLineHeight,
    contentHeight,
    height: BOX_PADDING * 2 + contentHeight,
    showCircle,
    percentage: showCircle ? parseFloat(box.percentage) : 0,
  };
}

function emptyLayout() {
  return {
    innerW: 0,
    headlineLines: [],
    bodyLines: [],
    headlineLineHeight: 0,
    bodyLineHeight: 0,
    contentHeight: 0,
    height: 0,
    showCircle: false,
    percentage: 0,
  };
}

function measureContentHeight(
  headlineLines,
  bodyLines,
  headlineLineHeight,
  bodyLineHeight,
) {
  let height = 0;

  if (headlineLines.length > 0) {
    height += headlineLines.length * headlineLineHeight;
  }

  if (headlineLines.length > 0 && bodyLines.length > 0) {
    height += HEADLINE_GAP;
  }

  if (bodyLines.length > 0) {
    height += bodyLines.length * bodyLineHeight;
  }

  return height;
}

function drawBox(ctx, x, y, w, layout, theme, { centerText = false, animationContext = null } = {}) {
  const {
    innerW,
    headlineLines,
    bodyLines,
    headlineLineHeight,
    bodyLineHeight,
    height,
    showCircle,
    percentage,
  } = layout;

  if (height <= 0) return;

  roundRect(ctx, x, y, w, height, BOX_RADIUS);
  ctx.fillStyle = theme['color-box-bg'];
  ctx.fill();

  const innerX = x + BOX_PADDING;
  let cursorY = y + BOX_PADDING;
  
  // Draw circular progress diagram if percentage is present
  if (showCircle) {
    const circleX = innerX + innerW - CIRCLE_SIZE / 2;
    const circleY = cursorY + CIRCLE_SIZE / 2;
    drawCircularProgress(ctx, circleX, circleY, CIRCLE_SIZE / 2, percentage, theme, animationContext);
  }

  // Text positioning
  const textWidth = showCircle ? innerW - CIRCLE_SIZE - CIRCLE_GAP : innerW;
  const textX = centerText ? innerX + textWidth / 2 : innerX;

  ctx.save();
  ctx.textBaseline = 'top';
  ctx.textAlign = centerText ? 'center' : 'left';

  if (headlineLines.length > 0) {
    ctx.fillStyle = theme['color-headline'];
    ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;
    for (const line of headlineLines) {
      ctx.fillText(line, textX, cursorY);
      cursorY += headlineLineHeight;
    }
  }

  if (headlineLines.length > 0 && bodyLines.length > 0) {
    cursorY += HEADLINE_GAP;
  }

  if (bodyLines.length > 0) {
    ctx.fillStyle = theme['color-body'];
    ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
    for (const line of bodyLines) {
      ctx.fillText(line, textX, cursorY);
      cursorY += bodyLineHeight;
    }
  }

  ctx.restore();
}

function drawCircularProgress(ctx, centerX, centerY, radius, percentage, theme, animationContext = null) {
  const lineWidth = 12;
  const startAngle = -Math.PI / 2; // Start at top
  
  // Calculate animated percentage: start at 0 and animate to target percentage
  let currentPercentage = percentage;
  if (animationContext) {
    currentPercentage = percentage * animationContext.progress;
  }
  
  const endAngle = startAngle + (2 * Math.PI * currentPercentage) / 100;
  
  ctx.save();
  
  // Draw background circle (track)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - lineWidth / 2, 0, 2 * Math.PI);
  ctx.strokeStyle = theme['color-body'];
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  // Draw progress arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - lineWidth / 2, startAngle, endAngle);
  ctx.strokeStyle = theme['color-headline'];
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  ctx.restore();
}

function capitalizeHeadline(text) {
  return String(text).toUpperCase();
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
