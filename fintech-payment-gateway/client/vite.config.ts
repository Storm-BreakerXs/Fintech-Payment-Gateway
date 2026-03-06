import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/ethers/')) {
            return 'vendor-ethers'
          }

          if (
            id.includes('/@stripe/') ||
            id.includes('/qrcode.react/')
          ) {
            return 'vendor-payments'
          }

          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'vendor-charts'
          }
        },
      },
    },
  },
})
