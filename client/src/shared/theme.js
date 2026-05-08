export const theme = {
  colors: {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F9FAFB',
    bgTertiary: '#F3F4F6',
    brandPrimary: '#245143',
    brandHover: '#245143',
    brandPressed: '#245143',
    brandSubtle: '#E8F2EF',
    textPrimary: '#245143',
    textSecondary: '#4F7066',
    borderDefault: '#9CB9AE',
    bubbleOwn: '#EEF6F3',
    statusOnline: '#245143',
  },
  shadows: {
    card: '0 1px 2px rgba(36, 81, 67, 0.08)',
    drawer: '0 18px 48px rgba(36, 81, 67, 0.18)',
  },
};

export const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
  root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-brand-primary', theme.colors.brandPrimary);
};

export default theme;
