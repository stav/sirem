import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    include: ['src/**/*.test.ts'],
    coverage: {
      enabled: false,
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: [
      { find: '@/schema', replacement: resolve(__dirname, 'data/schema') },
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },
})
