import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'src/routeTree.gen.ts'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } },
    plugins: { '@typescript-eslint': tseslint, 'react-hooks': reactHooks },
    rules: {
      // Pinned to the two rules this project enforced before the
      // eslint-plugin-react-hooks v5→v7 bump (required to resolve the
      // eslint@10 peer dependency upgrade — see AUDIT-REPORT.md §4.12 /
      // FIX-LOG.md 5.6). v7's `recommended` preset also bundles ~14 new
      // experimental "React Compiler" rules; enabling all of them would
      // surface findings across many pre-existing, unrelated files, which
      // is out of scope for this fix pass.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
