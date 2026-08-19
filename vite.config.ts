import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use base path from env so the same codebase can deploy to
// a project page (/<repo>/) or a custom domain root (/).
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
});
