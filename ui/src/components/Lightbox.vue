<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import type { SearchResult } from '../types'
import { hostOf, resultImageUrl } from '../api/rustxng'

const props = defineProps<{ results: SearchResult[]; index: number }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', index: number): void
}>()

const current = () => props.results[props.index]

function prev() {
  if (props.index > 0) emit('navigate', props.index - 1)
}
function next() {
  if (props.index < props.results.length - 1) emit('navigate', props.index + 1)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="lightbox" role="dialog" aria-modal="true" aria-label="Image preview" @click.self="emit('close')">
    <button class="lb-close" type="button" aria-label="Close" @click="emit('close')">✕</button>
    <button class="lb-nav lb-prev" type="button" aria-label="Previous image" :disabled="index <= 0" @click="prev">‹</button>
    <figure v-if="current()" class="lb-figure">
      <img :src="resultImageUrl(current())" :alt="current().title || 'Image'" />
      <figcaption>
        <div class="lb-title">{{ current().title }}</div>
        <a class="lb-source" :href="current().url" target="_blank" rel="noopener noreferrer">
          {{ hostOf(current().url) }} ↗
        </a>
        <div class="lb-count">{{ index + 1 }} / {{ results.length }}</div>
      </figcaption>
    </figure>
    <button class="lb-nav lb-next" type="button" aria-label="Next image" :disabled="index >= results.length - 1" @click="next">›</button>
  </div>
</template>
