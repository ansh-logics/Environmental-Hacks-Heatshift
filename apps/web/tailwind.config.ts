import type { Config } from 'tailwindcss';

/**
 * High-contrast, sunlight-readable palette: warm off-white surfaces, near-black
 * text, and a heat scale that stays distinguishable for colour-blind users
 * (each level also renders with a text label, never colour alone).
 *
 * Colour roles are fixed:
 *   heat-accent   brand + interactive emphasis + active navigation
 *   heat-low      green  - safe / connected / verified
 *   heat-moderate amber  - caution
 *   heat-severe   red    - urgent
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#fffaf5',
          100: '#fff3e8',
          200: '#f5e4d2',
          300: '#ecd6c0',
          400: '#d9bb9e',
        },
        ink: {
          400: '#7a655c',
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
      maxWidth: {
        /** Desktop content width: wide enough to use a laptop, narrow enough to read. */
        shell: '1400px',
        prose: '68ch',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 18, 13, 0.05), 0 6px 18px -12px rgba(28, 18, 13, 0.14)',
        panel:
          '0 1px 2px rgba(28, 18, 13, 0.04), 0 16px 40px -24px rgba(28, 18, 13, 0.22)',
      },
      spacing: {
        /** Clears the fixed bottom navigation (≈75px) with breathing room. */
        nav: 'calc(5.5rem + env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
} satisfies Config;
