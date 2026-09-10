import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    env: {
      ENCRYPTION_KEY: '12345678901234567890123456789012'
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
