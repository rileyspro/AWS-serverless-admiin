/// <reference types="vitest" />
import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import { join } from 'path';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/backend',
  plugins: [
    viteTsConfigPaths({
      root: '../../',
    }),
  ],
  resolve: {
    alias: {
      '*': join(__dirname, './src/layers/dependencyLayer/nodejs/node_modules'), //lambda layer path
      '/opt': join(__dirname, './src/layers/dependencyLayer/opt'), //lambda layer path
      'dependency-layer': join(__dirname, './src/layers/dependencyLayer/opt'), //lambda layer path
    },
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [
  //    viteTsConfigPaths({
  //      root: '../../',
  //    }),
  //  ],
  // },

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['test-setup.ts'],
    coverage: {
      enabled: true,
    },
  },
});
