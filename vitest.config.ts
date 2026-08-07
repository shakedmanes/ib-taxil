import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: [
        '**/*.d.ts',
        '**/types.ts',
        'lib/tax/explain.ts', // pure string-key builders, asserted via consumers
      ],
      // Regression floors set at/just below current coverage. The pure engine
      // (lib/tax, lib/boi, lib/ibkr, lib/reports) sits well above 80%; UI
      // components pull functions/branches down. Raise these as coverage grows.
      thresholds: { statements: 80, lines: 80, functions: 70, branches: 60 },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
