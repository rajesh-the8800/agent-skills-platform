import js from '@eslint/js';

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**'],
  },
  js.configs.recommended,
];

