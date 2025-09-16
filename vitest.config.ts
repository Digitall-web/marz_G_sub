import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Ensure jalaliday's internal import 'dayjs/locale/fa' resolves (explicit extension for ESM resolution)
      'dayjs/locale/fa': 'dayjs/locale/fa.js',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      enabled: false,
    },
  },
});
