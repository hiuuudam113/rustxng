import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// The backend sends CORS headers (ddgs-rs) / no CORS headers (RustXNG),
// so a page served from another origin (e.g. Vite dev on :5173) cannot
// always call it directly. Vite proxies /api/* to the backend instead, so
// the browser only ever talks to its own origin.
//
// Default backend is ddgs-rs on http://127.0.0.1:29484
// (`ddgs-rs serve --bind 127.0.0.1 --port 29484`).
// Target: $VITE_BACKEND_BASE_URL, falling back to $VITE_RUSTXNG_BASE_URL,
// default http://127.0.0.1:29484
//   VITE_BACKEND_BASE_URL=http://127.0.0.1:29483 npm run dev   # RustXNG instead
// The same proxy is configured for `vite preview` so a production
// build can be smoke-tested the same way.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target =
    env.VITE_BACKEND_BASE_URL || env.VITE_RUSTXNG_BASE_URL || 'http://127.0.0.1:29484'
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
