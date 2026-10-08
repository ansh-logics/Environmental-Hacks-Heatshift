import type { Config } from 'tailwindcss';

/**
 * High-contrast, sunlight-readable palette: warm off-white surfaces, near-black
 * text, and a heat scale that stays distinguishable for colour-blind users
 * (each level also renders with a text label, never colour alone).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#fffaf5',
          100: '#fff3e8',
          200: '#f7e6d5',
          300: '#ecd6c0',
          400: '#d9bb9e',
        },
        ink: {
          500: '#5d4c44',
          700: '#3a2c26',
          900: '#1c120d',
        },
        heat: {
          accent: '#e8590c',
          'accent-dark': '#c2410c',
          low: '#2b8a3e',
          moderate: '#b8860b',
          high: '#e8590c',
          severe: '#c92a2a',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans',
          'Noto Sans Devanagari',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 18, 13, 0.06), 0 8px 24px -12px rgba(28, 18, 13, 0.12)',
      },
      spacing: {
        nav: 'calc(4.5rem + env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
} satisfies Config;
