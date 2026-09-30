import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

/**
 * Flat config. Next.js 16 removed `next lint`, so ESLint runs through the CLI.
 * `eslint-config-next` now ships flat config arrays, so no FlatCompat shim is needed.
 *
 * Rule scope is deliberately kept equal to the previous `.eslintrc.json`
 * (`next/core-web-vitals`) so enabling the linter does not also impose a
 * stricter rule set than the project has ever been held to.
 */
const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // The structured logger intentionally writes JSON via console on the server.
      'no-console': 'off',
    },
  },
]

export default eslintConfig
