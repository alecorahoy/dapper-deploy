import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // Multi-page app: landing at root, React app at /app
      input: {
        main: resolve(__dirname, 'index.html'),
        app:  resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks: {
          react:  ['react', 'react-dom'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
})
