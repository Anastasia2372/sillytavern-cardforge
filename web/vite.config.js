import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  root: __dirname,
  base: '/sillytavern-cardforge/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('pixi.js') || id.includes('pixi-live2d-display')) {
            return 'vendor-pixi';
          }

          if (id.includes('codemirror') || id.includes('@codemirror')) {
            return 'vendor-codemirror';
          }

          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vendor-vue';
          }

          return 'vendor';
        }
      }
    }
  },
  server: {
    port: 5174
  }
});
