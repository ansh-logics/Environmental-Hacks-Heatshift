/** @type {import('prettier').Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 90,
  tabWidth: 2,
  arrowParens: 'always',
  overrides: [
    {
      files: ['*.md', '*.yml', '*.yaml'],
      options: { proseWrap: 'preserve', printWidth: 100 },
    },
  ],
};
