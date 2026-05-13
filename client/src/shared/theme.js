export const theme = {
  colors: {
    bgPrimary: 'var(--color-bg-primary)',
    bgSecondary: 'var(--color-bg-secondary)',
    bgTertiary: 'var(--color-bg-tertiary)',
    brandPrimary: 'var(--color-brand-primary)',
    brandHover: 'var(--color-brand-hover)',
    brandPressed: 'var(--color-brand-pressed)',
    brandSubtle: 'var(--color-brand-subtle)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    borderDefault: 'var(--color-border-default)',
    bubbleOwn: 'var(--color-bubble-own)',
    statusOnline: 'var(--color-status-online)',
  },
  shadows: {
    card: '0 1px 2px rgba(36, 81, 67, 0.08)',
    drawer: '0 18px 48px rgba(36, 81, 67, 0.18)',
  },
};

const palettes = {
  light: {
    bgPrimary: '#fbfcfa',
    bgSecondary: '#f4f7f4',
    bgTertiary: '#eef3f0',
    brandPrimary: '#245143',
    brandHover: '#1f493c',
    brandPressed: '#18392f',
    brandSubtle: '#e3eee9',
    textPrimary: '#17342c',
    textSecondary: '#557267',
    borderDefault: '#a9c1b7',
    bubbleOwn: '#e9f3ef',
    statusOnline: '#245143',
  },
  dark: {
    bgPrimary: '#101816',
    bgSecondary: '#15211e',
    bgTertiary: '#1b2a26',
    brandPrimary: '#7dd3b0',
    brandHover: '#99e0c3',
    brandPressed: '#5fc498',
    brandSubtle: '#203a33',
    textPrimary: '#e8f3ef',
    textSecondary: '#aac5bb',
    borderDefault: '#33544b',
    bubbleOwn: '#203a33',
    statusOnline: '#7dd3b0',
  },
};

export const getStoredThemeMode = () => {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('gatherly-theme') === 'dark' ? 'dark' : 'light';
};

export const applyTheme = (mode = getStoredThemeMode()) => {
  const root = document.documentElement;
  const palette = palettes[mode] || palettes.light;

  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  Object.entries(palette).forEach(([key, value]) => {
    const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    root.style.setProperty(`--color-${cssName}`, value);
  });

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('gatherly-theme', mode);
  }
};

export default theme;
