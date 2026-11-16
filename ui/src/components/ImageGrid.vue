<script setup lang="ts">
import { ref } from 'vue'
import type { SearchResult } from '../types'
import { hostOf, resultImageUrl } from '../api/rustxng'

defineProps<{ results: SearchResult[] }>()
const emit = defineEmits<{ (e: 'open', index: number): void }>()

const broken = ref<Set<string>>(new Set())
function onError(url: string) {
  broken.value = new Set(broken.value).add(url)
}
</script>

<template>
  <div class="image-grid">
    <figure
      v-for="(r, i) in results"
      :key="r.url + (r.img_src || '') + i"
      class="image-card"
      @click="emit('open', i)"
    >
      <img
        v-if="!broken.has(resultImageUrl(r)) && resultImageUrl(r)"
        :src="resultImageUrl(r)"
        :alt="r.title || 'Image result'"
        loading="lazy"
        @error="onError(resultImageUrl(r))"
      />
      <div v-else class="image-placeholder" aria-hidden="true">🖼️</div>
      <figcaption>
        <span class="img-title">{{ r.title || hostOf(r.url) }}</span>
        <span class="img-host">{{ hostOf(r.url) }}</span>
      </figcaption>
    </figure>
  </div>
</template>
