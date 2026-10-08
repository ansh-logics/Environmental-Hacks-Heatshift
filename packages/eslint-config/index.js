/**
 * Shared flat ESLint config for the HeatShift monorepo.
 * Apps can spread `base` and append framework-specific rules.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

export const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/dev-dist/**',
  '**/coverage/**',
  'pnpm-lock.yaml',
  '**/*.d.ts',
];

export const base = [
  { ignores },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  },
  prettier,
];

export default base;
