import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Integration tests are slow — give each file 30 s
    testTimeout: 30_000,
    // Run integration test files only
    include: ['**/*.integration.test.ts'],
    setupFiles: ['./lib/test/setup.ts'],
    // Run integration files sequentially so each gets a clean DB state
    sequence: { concurrent: false },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
