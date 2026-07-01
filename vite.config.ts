/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Served from the site root in dev/preview; the GitHub Pages workflow sets
  // VITE_BASE to "/<repo>/" so built asset URLs resolve under the project path.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    setupFiles: ['src/vitest.setup.ts'],
  },
});
