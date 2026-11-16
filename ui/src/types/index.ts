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
  [key: string]: unknown
}

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
  backendBase: string
  perPage: 10 | 20 | 30
  safesearch: 0 | 1 | 2
  timeRange: '' | 'day' | 'week' | 'month' | 'year'
  language: string
}

export const DEFAULT_BACKEND = 'http://127.0.0.1:29483'

export const DEFAULT_SETTINGS: Settings = {
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
