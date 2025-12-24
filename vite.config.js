import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,         // 서버 포트 명시
    strictPort: true,   // 포트 충돌 시 다음 포트로 넘기지 않음
    hmr: {
      host: 'localhost',
      port: 5173,       // WebSocket 포트가 undefined가 되지 않도록 강제
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})