// Types matching the RustXNG (SearXNG-compatible) JSON API.
// GET /search?q=...&format=json  -> SearchResponse

export interface SearchResult {
  url: string
  title: string
  content?: string
  img_src?: string
  thumbnail?: string
  thumbnail_src?: string
  engine?: string
  engines?: string[]
  category?: string
  score?: number
  publishedDate?: string
  template?: string
  // SearXNG/RustXNG may return extra fields; keep them accessible.
  [key: string]: unknown
}

export interface SearchResponse {
  query: string
  number_of_results?: number
  results: SearchResult[]
  answers?: string[] | Record<string, unknown>[]
  corrections?: string[]
  suggestions?: string[]
  infoboxes?: Record<string, unknown>[]
  unresponsive_engines?: string[] | string[][]
  /** ddgs-rs only: the backend that actually answered ("duckduckgo"/"bing") */
  backend_used?: string
  /** ddgs-rs only: true when DuckDuckGo was tried first and Bing answered */
  fallback?: boolean
  [key: string]: unknown
}

/** Which search backend the UI talks to. ddgs-rs is the default. */
export type BackendKind = 'ddgs-rs' | 'rustxng'

export type Category = 'general' | 'images' | 'videos' | 'news' | 'map' | 'music' | 'it' | 'science' | 'files' | 'social media'

export interface SearchParams {
  q: string
  categories?: string
  pageno?: number
  max_results?: number
  language?: string
  time_range?: '' | 'day' | 'week' | 'month' | 'year'
  engines?: string
  safesearch?: 0 | 1 | 2
}

export interface Settings {
  /** 'ddgs-rs' (default, :29484) or 'rustxng' (:29483) */
  backend: BackendKind
  backendBase: string
  perPage: 10 | 20 | 30
  safesearch: 0 | 1 | 2
  timeRange: '' | 'day' | 'week' | 'month' | 'year'
  language: string
}

/** Default URL per backend. */
export const BACKEND_DEFAULTS: Record<BackendKind, string> = {
  'ddgs-rs': 'http://127.0.0.1:29484',
  rustxng: 'http://127.0.0.1:29483',
}

export const DEFAULT_BACKEND = BACKEND_DEFAULTS['ddgs-rs']

export const DEFAULT_SETTINGS: Settings = {
  backend: 'ddgs-rs',
  backendBase: DEFAULT_BACKEND,
  perPage: 20,
  safesearch: 1,
  timeRange: '',
  language: '',
}

export const CATEGORY_TABS: { id: string; label: string; api: Category }[] = [
  { id: 'general', label: 'All', api: 'general' },
  { id: 'images', label: 'Images', api: 'images' },
  { id: 'videos', label: 'Videos', api: 'videos' },
  { id: 'news', label: 'News', api: 'news' },
]
