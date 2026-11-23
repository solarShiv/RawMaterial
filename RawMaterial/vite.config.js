import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // React core rarely changes, so keep it in its own long-cached chunk.
        // Heavy libs (xlsx, pdfjs, html5-qrcode) are split automatically with the lazy pages that use them.
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
        },
      },
    },
  },
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'https://logistics.umanerp.com',
  //       changeOrigin: true,
  //       secure: false,
  //       rewrite: (path) => path.replace(/^\/api/, '/api')
  //     }
  //   }
  // }
})
