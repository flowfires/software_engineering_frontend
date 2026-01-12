import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 意思：只要请求路径是以 /api 开头的，都转发给目标服务器
      '/api/v1': {
        target: 'http://120.55.124.236:8000',
        changeOrigin: true,
        // 如果后端路径里不需要 /api 前缀，可以用 rewrite 去掉，
        // 但看你的报错，后端确实有 /api，所以这里通常不需要 rewrite
      }
    }
  }
})