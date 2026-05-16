const MARGIN_VERTICAL = 48;
const MARGIN_HORIZONTAL = 24;
const BOX_PADDING = 16;
const BOX_RADIUS = 8;
const HEADLINE_GAP = 8;
const PROGRESS_GAP = 12;
const PROGRESS_BAR_HEIGHT = 8;
const PROGRESS_BAR_RADIUS = 4;

export function defaultProgressData() {
  return {
    box1: {
      headline: 'First insight',
      text: 'Short supporting copy for the first point in your overlay.',
    },
    box2: {
      headline: 'Progress tracking',
      progress1Name: 'Collection name',
      progress1Current: '42',
      progress1Total: '100',
      progress2Name: '',
      progress2Current: '',
      progress2Total: '',
      progress3Name: '',
      progress3Current: '',
      progress3Total: '',
      progress4Name: '',
      progress4Current: '',
      progress4Total: '',
    },
  };
}

export function drawProgress(ctx, data, width, height, theme, animationContext = null) {
  const boxWidth = width - MARGIN_HORIZONTAL * 2;

  const layout1 = measureBox(ctx, normalizeBox(data?.box1), boxWidth, theme, false);
  if (layout1.height > 0) {
    drawBox(ctx, MARGIN_HORIZONTAL, MARGIN_VERTICAL, boxWidth, layout1, theme, { centerText: true });
  }

  const layout2 = measureBox(ctx, normalizeBox(data?.box2), boxWidth, theme, true);
  if (layout2.height > 0) {
    const y2 = height - MARGIN_VERTICAL - layout2.height;
    drawBox(ctx, MARGIN_HORIZONTAL, y2, boxWidth, layout2, theme, { animationContext });
  }
}

function normalizeBox(box) {
  if (!box || typeof box !== 'object') {
    return { 
      headline: '', 
      text: '',
      progressItems: []
    };
  }
  
  // For box2, collect progress items
  const progressItems = [];
  for (let i = 1; i <= 4; i++) {
    const name = box[`progress${i}Name`] ?? '';
    const current = box[`progress${i}Current`] ?? '';
    const total = box[`progress${i}Total`] ?? '';
    
    if (name.trim() || current.trim() || total.trim()) {
      const currentNum = parseFloat(current) || 0;
      const totalNum = parseFloat(total) || 0;
      const percentage = totalNum > 0 ? Math.min((currentNum / totalNum) * 100, 100) : 0;
      
      progressItems.push({
        name: name.trim(),
        current: current.trim(),
        total: total.trim(),
        percentage,
      });
    }
  }
  
  return {
    headline: box.headline ?? '',
    text: box.text ?? '',
    progressItems,
  };
}

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function hasContent(box) {
  return hasText(box.headline) || hasText(box.text) || box.progressItems?.length > 0;
}

function measureBox(ctx, box, w, theme, isProgressBox) {
  if (!hasContent(box)) {
    return emptyLayout();
  }

  const innerW = Math.max(0, w - BOX_PADDING * 2);

  ctx.font = `bold ${theme.fontSizeHeadline}px ${theme['font-headline']}`;
  const headlineLines = hasText(box.headline)
    ? wrapText(ctx, capitalizeHeadline(box.headline), innerW)
    : [];
  const headlineLineHeight = theme.fontSizeHeadline * 1.3;

  let bodyLines = [];
  let bodyLineHeight = 0;
  let progressItemsHeight = 0;
  
  if (isProgressBox && box.progressItems?.length > 0) {
    // Measure progress items
    ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
    bodyLineHeight = theme.fontSizeBody * 1.4;
    const smallerFontSize = theme.fontSizeBody * 0.85;
    const smallerLineHeight = smallerFontSize * 1.4;
    
    // Each progress item: name line + progress bar + small gap + count line + gap
    const itemHeight = bodyLineHeight + PROGRESS_BAR_HEIGHT + 4 + smallerLineHeight + PROGRESS_GAP;
    progressItemsHeight = box.progressItems.length * itemHeight - PROGRESS_GAP; // Remove last gap
  } else {
    ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
    bodyLines = hasText(box.text) ? wrapText(ctx, box.text, innerW) : [];
    bodyLineHeight = theme.fontSizeBody * 1.4;
  }

  const textContentHeight = measureContentHeight(
    headlineLines,
    bodyLines,
    headlineLineHeight,
    bodyLineHeight,
  );
  
  const contentHeight = isProgressBox && box.progressItems?.length > 0
    ? measureContentHeightWithProgress(headlineLines, headlineLineHeight, progressItemsHeight)
    : textContentHeight;

  return {
    innerW,
    headlineLines,
    bodyLines,
    headlineLineHeight,
    bodyLineHeight,
    contentHeight,
    height: BOX_PADDING * 2 + contentHeight,
    progressItems: box.progressItems || [],
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
    progressItems: [],
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

function measureContentHeightWithProgress(
  headlineLines,
  headlineLineHeight,
  progressItemsHeight,
) {
  let height = 0;

  if (headlineLines.length > 0) {
    height += headlineLines.length * headlineLineHeight;
  }

  if (headlineLines.length > 0 && progressItemsHeight > 0) {
    height += HEADLINE_GAP;
  }

  if (progressItemsHeight > 0) {
    height += progressItemsHeight;
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
    progressItems,
  } = layout;

  if (height <= 0) return;

  roundRect(ctx, x, y, w, height, BOX_RADIUS);
  ctx.fillStyle = theme['color-box-bg'];
  ctx.fill();

  const innerX = x + BOX_PADDING;
  const textX = centerText ? innerX + innerW / 2 : innerX;
  let cursorY = y + BOX_PADDING;

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

  if (headlineLines.length > 0 && (bodyLines.length > 0 || progressItems.length > 0)) {
    cursorY += HEADLINE_GAP;
  }

  // Draw progress items
  if (progressItems.length > 0) {
    ctx.textAlign = 'left';
    ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
    
    for (const item of progressItems) {
      // Draw name
      ctx.fillStyle = theme['color-body'];
      ctx.fillText(item.name, innerX, cursorY);
      cursorY += bodyLineHeight;
      
      // Draw progress bar
      const animatedPercentage = animationContext 
        ? item.percentage * animationContext.progress 
        : item.percentage;
      drawProgressBar(ctx, innerX, cursorY, innerW, PROGRESS_BAR_HEIGHT, animatedPercentage, theme);
      cursorY += PROGRESS_BAR_HEIGHT + 4; // Small gap between bar and count
      
      // Draw count (right-aligned, smaller text)
      const smallerFontSize = theme.fontSizeBody * 0.85;
      ctx.font = `${smallerFontSize}px ${theme['font-body']}`;
      const countText = `${item.current}/${item.total}`;
      ctx.textAlign = 'right';
      ctx.fillText(countText, innerX + innerW, cursorY);
      ctx.textAlign = 'left';
      ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`; // Reset font
      cursorY += smallerFontSize * 1.4 + PROGRESS_GAP;
    }
  } else if (bodyLines.length > 0) {
    // Draw regular text if no progress items
    ctx.fillStyle = theme['color-body'];
    ctx.font = `${theme.fontSizeBody}px ${theme['font-body']}`;
    for (const line of bodyLines) {
      ctx.fillText(line, textX, cursorY);
      cursorY += bodyLineHeight;
    }
  }

  ctx.restore();
}

function drawProgressBar(ctx, x, y, width, height, percentage, theme) {
  const radius = PROGRESS_BAR_RADIUS;
  
  ctx.save();
  
  // Draw background bar
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = theme['color-body'];
  ctx.globalAlpha = 0.3;
  ctx.fill();
  
  // Draw progress fill
  const fillWidth = Math.max(0, (width * percentage) / 100);
  if (fillWidth > 0) {
    roundRect(ctx, x, y, fillWidth, height, radius);
    ctx.fillStyle = theme['color-headline'];
    ctx.globalAlpha = 1.0;
    ctx.fill();
  }
  
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
