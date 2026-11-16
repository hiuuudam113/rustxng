<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import SearchBar from './components/SearchBar.vue'
import Tabs from './components/Tabs.vue'
import ResultList from './components/ResultList.vue'
import ImageGrid from './components/ImageGrid.vue'
import Lightbox from './components/Lightbox.vue'
import SettingsBar from './components/SettingsBar.vue'
import { getBackendBase, health, loadSettings, saveSettings, search } from './api/rustxng'
import type { SearchResponse, Settings } from './types'
import { CATEGORY_TABS } from './types'

const RECENT_KEY = 'rustxng.recent.v1'
const THEME_KEY = 'rustxng.theme.v1'

// --- theme ---
const theme = ref<'light' | 'dark'>(
  (localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
)
function applyTheme() {
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem(THEME_KEY, theme.value)
}
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme()
}

// --- state, synced to the URL (?q=, category, page) ---
const query = ref('')
const category = ref('general')
const page = ref(1)
const results = ref<SearchResponse | null>(null)
const loading = ref(false)
const error = ref('')
const lightboxIndex = ref(-1)

const settings = ref<Settings>(loadSettings())
const backendOk = ref<boolean | null>(null)
const recent = ref<string[]>([])

try {
  recent.value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
} catch {
  recent.value = []
}

function saveRecent(q: string) {
  recent.value = [q, ...recent.value.filter((r) => r !== q)].slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value))
}

function readUrl() {
  const u = new URLSearchParams(window.location.search)
  query.value = u.get('q') || ''
  category.value = u.get('category') || 'general'
  page.value = Math.max(1, Number(u.get('page') || '1') || 1)
}

function pushUrl() {
  const u = new URLSearchParams()
  if (query.value) u.set('q', query.value)
  if (category.value !== 'general') u.set('category', category.value)
  if (page.value > 1) u.set('page', String(page.value))
  const qs = u.toString()
  history.pushState(null, '', qs ? `/?${qs}` : '/')
}

const isImageCategory = computed(() => category.value === 'images')
const isHome = computed(() => !query.value.trim())
const categoryLabel = computed(
  () => CATEGORY_TABS.find((t) => t.id === category.value)?.label || 'All',
)
const unresponsive = computed(() => {
  const u = results.value?.unresponsive_engines
  if (!u) return []
  return Array.isArray(u) ? (u.flat() as string[]) : []
})

async function doSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = null
    error.value = ''
    return
  }
  loading.value = true
  error.value = ''
  results.value = null
  try {
    results.value = await search({
      q,
      categories: category.value,
      pageno: page.value,
      max_results: settings.value.perPage,
      safesearch: settings.value.safesearch,
      time_range: settings.value.timeRange,
      language: settings.value.language || undefined,
    })
    saveRecent(q)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Search failed'
  } finally {
    loading.value = false
  }
}

function submitSearch(q: string) {
  query.value = q
  page.value = 1
  pushUrl()
  void doSearch()
}

function selectCategory(id: string) {
  category.value = id
  page.value = 1
  if (!isHome.value) {
    pushUrl()
    void doSearch()
  }
}

function goPage(n: number) {
  page.value = Math.max(1, n)
  pushUrl()
  void doSearch()
  window.scrollTo({ top: 0 })
}

function goHome() {
  query.value = ''
  page.value = 1
  results.value = null
  history.pushState(null, '', '/')
}

function clearRecent() {
  recent.value = []
  localStorage.removeItem(RECENT_KEY)
}

function onSettings(s: Settings) {
  settings.value = s
  saveSettings(s)
}

async function checkBackend() {
  backendOk.value = await health()
}

watch(settings, () => {
  // Changing per-page / filters re-runs the current search.
  if (!isHome.value) void doSearch()
})

onMounted(() => {
  applyTheme()
  readUrl()
  window.addEventListener('popstate', () => {
    readUrl()
    void doSearch()
  })
  if (!isHome.value) void doSearch()
  void checkBackend()
})
</script>

<template>
  <div class="app">
    <header class="topbar">
      <a class="brand" href="/" @click.prevent="goHome">
        <span class="brand-mark">⚡</span> RustXNG
      </a>
      <div class="topbar-right">
        <span class="backend-pill" :title="getBackendBase()">
          {{ backendOk === true ? '●' : backendOk === false ? '○' : '◌' }} {{ getBackendBase() }}
        </span>
        <button class="theme-btn" type="button" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          {{ theme === 'dark' ? '☀️ Light' : '🌙 Dark' }}
        </button>
      </div>
    </header>

    <!-- HOME -->
    <main v-if="isHome" class="home">
      <h1 class="logo">Rust<span>XNG</span></h1>
      <p class="tagline">Self-hosted metasearch — text, images, videos and news.</p>
      <SearchBar v-model="query" :autofocus="true" @search="submitSearch" />
      <Tabs :active="category" @select="selectCategory" />
      <div v-if="recent.length" class="recent">
        <span>Recent:</span>
        <button v-for="r in recent" :key="r" type="button" @click="submitSearch(r)">{{ r }}</button>
        <button type="button" class="clear-recent" @click="clearRecent">Clear</button>
      </div>
      <SettingsBar :settings="settings" :backend-ok="backendOk" @update="onSettings" @check="checkBackend" />
    </main>

    <!-- RESULTS -->
    <main v-else class="results-page">
      <div class="results-head">
        <SearchBar v-model="query" @search="submitSearch" />
        <Tabs :active="category" @select="selectCategory" />
      </div>

      <div v-if="error" class="error-banner" role="alert">
        <strong>Couldn't reach the backend ({{ getBackendBase() }}).</strong>
        <span>{{ error }} — is the backend running? For ddgs-rs: <code>ddgs-rs serve</code>. For RustXNG: check the URL in Settings.</span>
        <button type="button" @click="doSearch">Retry</button>
      </div>

      <div v-if="loading" class="skeleton" aria-label="Loading results">
        <div v-for="i in 5" :key="i" class="skel-line" />
      </div>

      <template v-else-if="results">
        <div v-if="results.corrections?.length" class="did-you-mean">
          Did you mean:
          <button v-for="c in results.corrections" :key="c" type="button" @click="submitSearch(c)">{{ c }}</button>
        </div>
        <div v-if="results.suggestions?.length" class="suggestions-line">
          Related: {{ results.suggestions.join(' · ') }}
        </div>
        <div v-if="results.backend_used" class="backend-line">
          Answered by <strong>{{ results.backend_used === 'duckduckgo' ? '🦆 DuckDuckGo' : results.backend_used }}</strong>
          <span v-if="results.fallback"> — DuckDuckGo blocked the request, fell back to Bing</span>
          <span> · via ddgs-rs</span>
        </div>
        <div v-if="results.answers?.length" class="answers">
          <div v-for="(a, i) in results.answers" :key="i">
            <template v-if="typeof a === 'string'">{{ a }}</template>
            <template v-else-if="(a as Record<string, unknown>).answer">
              <strong v-if="(a as Record<string, unknown>).title">{{ (a as Record<string, unknown>).title }}: </strong>{{ (a as Record<string, unknown>).answer }}
              <a v-if="(a as Record<string, unknown>).url" :href="(a as Record<string, unknown>).url as string" target="_blank" rel="noopener noreferrer">Source ↗</a>
            </template>
            <template v-else>{{ JSON.stringify(a) }}</template>
          </div>
        </div>

        <p v-if="!results.results.length" class="empty">
          No results for “{{ query }}” in {{ categoryLabel }}. Try different words or another category.
        </p>

        <template v-if="results.results.length">
          <ResultList v-if="!isImageCategory" :results="results.results" />
          <ImageGrid v-else :results="results.results" @open="(i) => (lightboxIndex = i)" />
        </template>

        <div v-if="unresponsive.length" class="note">
          Some engines didn't respond: {{ unresponsive.join(', ') }}
        </div>

        <nav v-if="results.results.length" class="pagination" aria-label="Pages">
          <button type="button" :disabled="page <= 1" @click="goPage(page - 1)">← Prev</button>
          <button
            v-for="n in [page - 1, page, page + 1].filter((n) => n >= 1)"
            :key="n"
            type="button"
            :class="{ current: n === page }"
            @click="goPage(n)"
          >
            {{ n }}
          </button>
          <button type="button" :disabled="results.results.length < settings.perPage" @click="goPage(page + 1)">
            Next →
          </button>
        </nav>
      </template>

      <SettingsBar :settings="settings" :backend-ok="backendOk" @update="onSettings" @check="checkBackend" />
    </main>

    <Lightbox
      v-if="lightboxIndex >= 0 && results"
      :results="results.results"
      :index="lightboxIndex"
      @close="lightboxIndex = -1"
      @navigate="(i) => (lightboxIndex = i)"
    />

    <footer class="footer">
      Powered by <strong>ddgs-rs</strong> (DuckDuckGo first, Bing fallback) · RustXNG still available in Settings · results open in a new tab
    </footer>
  </div>
</template>
