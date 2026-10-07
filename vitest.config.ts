import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    environmentMatchGlobs: [
      // API/integration tests run in Node (they import server-side ESM modules)
      ['**/__tests__/integration/**', 'node'],
      ['**/src/app/dashboard/__tests__/**', 'node'],
      // The provider adapter talks to a real loopback HTTP server. Under jsdom
      // the global `AbortController` is jsdom's, while the `fetch` that Node
      // injects validates a signal against Node's own class, so every request
      // carrying a signal is rejected with
      //   RequestInit: Expected signal (...) to be an instance of AbortSignal
      // before a byte is sent. That reads as a fault in the adapter rather than
      // a harness artefact, and the test then encodes the workaround instead of
      // the behaviour. Node has exactly one AbortSignal, so the mismatch does not
      // exist here.
      ['**/__tests__/unit/openai-compatible-provider.test.ts', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/app/layout.tsx',
        'src/app/page.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
