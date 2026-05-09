import themeTokens from './theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': themeTokens.colors.bgPrimary,
        'bg-secondary': themeTokens.colors.bgSecondary,
        'bg-tertiary': themeTokens.colors.bgTertiary,
        'brand-primary': themeTokens.colors.brandPrimary,
        'brand-hover': themeTokens.colors.brandHover,
        'brand-pressed': themeTokens.colors.brandPressed,
        'brand-subtle': themeTokens.colors.brandSubtle,
        'text-primary': themeTokens.colors.textPrimary,
        'text-secondary': themeTokens.colors.textSecondary,
        'border-default': themeTokens.colors.borderDefault,
        'bubble-own': themeTokens.colors.bubbleOwn,
        'status-online': themeTokens.colors.statusOnline,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: themeTokens.shadows.card,
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 300ms ease-out',
      },
    },
  },
  plugins: [],
};
