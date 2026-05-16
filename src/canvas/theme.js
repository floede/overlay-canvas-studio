const PROBE_ID = 'theme-probe';

const VAR_KEYS = [
  'color-forest',
  'color-forest-muted',
  'color-light-green',
  'color-cream',
  'color-box-bg',
  'color-box-border',
  'color-headline',
  'color-body',
  'font-headline',
  'font-body',
  'font-size-headline',
  'font-size-body',
];

let cachedTheme = null;

function readVar(styles, name) {
  return styles.getPropertyValue(`--${name}`).trim();
}

export function getTheme() {
  const probe = document.getElementById(PROBE_ID);
  if (!probe) return cachedTheme ?? defaultTheme();

  const styles = getComputedStyle(probe);
  const theme = {};

  for (const key of VAR_KEYS) {
    theme[key] = readVar(styles, key);
  }

  theme.fontSizeHeadline = parseFloat(theme['font-size-headline']) || 22;
  theme.fontSizeBody = parseFloat(theme['font-size-body']) || 15;

  cachedTheme = theme;
  return theme;
}

export function invalidateThemeCache() {
  cachedTheme = null;
}

function defaultTheme() {
  return {
    'color-box-bg': '#f4f1de',
    'color-box-border': '#1b4332',
    'color-headline': '#1b4332',
    'color-body': '#2d6a4f',
    'font-headline': 'system-ui, sans-serif',
    'font-body': 'Georgia, serif',
    fontSizeHeadline: 22,
    fontSizeBody: 15,
  };
}
