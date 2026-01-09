import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://120.55.124.236:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
