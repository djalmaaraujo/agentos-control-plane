import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// The AgentOS REST API the browser talks to. In dev we proxy /api to the local
// runtime so the bearer key lives in the proxy, not the browser (same as the
// nginx proxy in production). Set AGENTOS_URL and OS_SECURITY_KEY in a local
// .env (see .env.example).
const agentosUrl = process.env.AGENTOS_URL ?? 'http://127.0.0.1:8000'
const osSecurityKey = process.env.OS_SECURITY_KEY ?? ''

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: agentosUrl,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', `Bearer ${osSecurityKey}`)
          })
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
})
