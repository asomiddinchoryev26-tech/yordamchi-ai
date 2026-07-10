// Flat ESLint config (ESLint 9) for React 19 + TypeScript.
// Activate with:  npm install   (dev-dependencies are declared in package.json)
// Run with:       npm run lint
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'supabase/functions/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Off: dev-HMR-only nudge. This codebase colocates hooks with their
      // providers (useAuth + AuthProvider, etc.) and variants with UI components
      // by design — an accepted pattern the rule cannot express.
      'react-refresh/only-export-components': 'off',
      // Kept as warnings so lint never blocks the build; tighten to 'error' over time.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
)
