import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// RustXNG sends NO CORS headers, so a page served from another origin
// (e.g. Vite dev on :5173) cannot call it directly. Vite proxies /api/*
// to the RustXNG backend instead, so the browser only ever talks to
// its own origin.
//
// Target: $VITE_RUSTXNG_BASE_URL, default http://127.0.0.1:29483
//   VITE_RUSTXNG_BASE_URL=http://127.0.0.1:29483 npm run dev
// The same proxy is configured for `vite preview` so a production
// build can be smoke-tested the same way.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_RUSTXNG_BASE_URL || 'http://127.0.0.1:29483'
  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  }
  return {
    plugins: [vue()],
    server: { proxy, port: 5173 },
    preview: { proxy, port: 4173 },
  }
})
