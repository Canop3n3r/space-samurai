import { defineConfig } from 'vite';

export default defineConfig({
  base: '/space-samurai/',
  server: { host: '127.0.0.1', port: 5173 },
  build: { outDir: 'dist', sourcemap: true },
});
