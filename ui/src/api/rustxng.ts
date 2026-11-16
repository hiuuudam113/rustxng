import type { SearchParams, SearchResponse, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const SETTINGS_KEY = 'rustxng.settings.v1'

// ---------------------------------------------------------------------------
// Backend base URL + API prefix
// ---------------------------------------------------------------------------

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

/** Backend URL the user configured (or the env default). Shown in the UI. */
export function getBackendBase(): string {
  const env = (import.meta.env.VITE_RUSTXNG_BASE_URL as string | undefined) || ''
  const saved = loadSettings().backendBase
  return (saved || env || DEFAULT_SETTINGS.backendBase).replace(/\/$/, '')
}

/**
 * Prefix for API calls.
 * - Served by RustXNG itself (same origin, port 29483): '' — call /search directly.
 * - Vite dev / preview (ports 5173 / 4173): '/api' — Vite proxies it to the
 *   backend, which avoids CORS (RustXNG sends no CORS headers).
 * - Anywhere else: the configured backend URL directly. This only works
 *   same-origin or if the backend is reached through a reverse proxy that
 *   maps /api -> RustXNG; a plain cross-origin fetch will be blocked by CORS.
 *
 * NOTE: in dev/preview the proxy target is fixed at Vite startup from
 * VITE_RUSTXNG_BASE_URL. Changing the backend URL in Settings takes effect
 * for same-origin / direct serving, and after a dev restart for the proxy.
 */
export function apiPrefix(): string {
  if (typeof window === 'undefined') return '/api'
  if (window.location.port === '29483') return ''
  if (import.meta.env.DEV) return '/api'
  if (window.location.port === '4173') return '/api'
  return getBackendBase()
}

/** Resolve a backend-relative path (/image_proxy?url=..., /favicon_proxy?...)
 *  to a URL the browser can load, going through the same prefix as the API. */
export function resolveBackendUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const prefix = apiPrefix()
  if (prefix === '') return pathOrUrl
  if (prefix === '/api') return `/api${pathOrUrl}`
  return `${prefix}${pathOrUrl}`
}

/** Image URL for a result: thumbnail first, fall back to img_src. */
export function resultImageUrl(r: { thumbnail?: string; thumbnail_src?: string; img_src?: string }): string {
  const src = r.thumbnail || r.thumbnail_src || r.img_src || ''
  return resolveBackendUrl(src)
}

/** Host name for display, e.g. "en.wikipedia.org". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiPrefix()}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Backend returned HTTP ${res.status} for ${path}`)
  return (await res.json()) as T
}

/** GET /search?q=...&format=json — text or image search, depending on categories. */
export async function search(params: SearchParams): Promise<SearchResponse> {
  const q = new URLSearchParams()
  q.set('q', params.q)
  q.set('format', 'json')
  if (params.categories) q.set('categories', params.categories)
  if (params.pageno) q.set('pageno', String(params.pageno))
  if (params.max_results) q.set('max_results', String(params.max_results))
  if (params.language) q.set('language', params.language)
  if (params.time_range) q.set('time_range', params.time_range)
  if (params.engines) q.set('engines', params.engines)
  if (params.safesearch !== undefined) q.set('safesearch', String(params.safesearch))
  return getJson<SearchResponse>(`/search?${q.toString()}`)
}

export const searchText = (p: SearchParams) => search({ ...p, categories: 'general' })
export const searchImages = (p: SearchParams) => search({ ...p, categories: 'images' })

/** GET /autocompleter?q=... -> string[] */
export async function autocomplete(q: string): Promise<string[]> {
  const params = new URLSearchParams({ q })
  const data = await getJson<unknown>(`/autocompleter?${params.toString()}`)
  if (Array.isArray(data)) return data.filter((x): x is string => typeof x === 'string')
  if (data && typeof data === 'object' && Array.isArray((data as { suggestions?: unknown }).suggestions)) {
    return ((data as { suggestions: unknown[] }).suggestions).filter((x): x is string => typeof x === 'string')
  }
  return []
}

/** GET /healthz */
export async function health(): Promise<boolean> {
  try {
    const res = await fetch(`${apiPrefix()}/healthz`)
    return res.ok
  } catch {
    return false
  }
}
