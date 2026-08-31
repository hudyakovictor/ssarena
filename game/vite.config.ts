import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443 },
  },
  preview: { host: '0.0.0.0', port: 5180, allowedHosts: true },
  build: { outDir: 'dist', target: 'es2020', chunkSizeWarningLimit: 2000 },
});
