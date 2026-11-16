<script setup lang="ts">
import type { SearchResult } from '../types'
import { hostOf, resolveBackendUrl } from '../api/rustxng'

defineProps<{ results: SearchResult[] }>()

function favicon(r: SearchResult): string {
  // RustXNG proxies favicons at /favicon_proxy?url=<host> — only use it
  // when it is a simple host lookup; otherwise the host initial is shown.
  return resolveBackendUrl(`/favicon_proxy?url=${encodeURIComponent(hostOf(r.url))}`)
}
</script>

<template>
  <ol class="results">
    <li v-for="r in results" :key="r.url + (r.title || '')" class="result">
      <a class="result-title" :href="r.url" target="_blank" rel="noopener noreferrer">
        {{ r.title || r.url }}
      </a>
      <div class="result-meta">
        <img
          class="favicon"
          :src="favicon(r)"
          :alt="''"
          loading="lazy"
          @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
        />
        <span class="host">{{ hostOf(r.url) }}</span>
        <span v-if="r.engine || (r.engines && r.engines.length)" class="engine">
          · {{ r.engine || (r.engines || []).join(', ') }}
        </span>
        <span v-if="r.publishedDate" class="date">· {{ r.publishedDate }}</span>
      </div>
      <p v-if="r.content" class="snippet">{{ r.content }}</p>
    </li>
  </ol>
</template>
