import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Standalone config so the test runner doesn't load the Tailwind / Rolldown
// build plugins. Pure-logic unit tests run in a fast Node environment.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: false,
    // Dummy values so modules that build the Supabase client at import time load
    // in tests without a real .env (no network — the client is inert until queried).
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
