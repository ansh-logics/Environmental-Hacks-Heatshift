import { base } from '@heatshift/eslint-config';

export default [
  ...base,
  {
    ignores: ['apps/web/public/**', 'apps/api/drizzle/**'],
  },
  {
    // Server code may log through the pino-style logger only; keep console use loud in the browser.
    files: ['apps/api/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];
