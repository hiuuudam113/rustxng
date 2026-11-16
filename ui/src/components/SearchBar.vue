<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { autocomplete } from '../api/rustxng'

const props = defineProps<{ modelValue: string; autofocus?: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'search', q: string): void
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const suggestions = ref<string[]>([])
const active = ref(-1)
let timer: ReturnType<typeof setTimeout> | undefined

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:modelValue', v)
  active.value = -1
  clearTimeout(timer)
  const q = v.trim()
  if (q.length < 2) {
    suggestions.value = []
    open.value = false
    return
  }
  timer = setTimeout(async () => {
    try {
      suggestions.value = await autocomplete(q)
      open.value = suggestions.value.length > 0
    } catch {
      suggestions.value = []
      open.value = false
    }
  }, 250)
}

function submit(q?: string) {
  const query = (q ?? props.modelValue).trim()
  if (!query) return
  open.value = false
  emit('search', query)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' && suggestions.value.length) {
    e.preventDefault()
    active.value = Math.min(active.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp' && suggestions.value.length) {
    e.preventDefault()
    active.value = Math.max(active.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    submit(active.value >= 0 ? suggestions.value[active.value] : undefined)
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function onBlur() {
  // Delay so a click on a suggestion still registers.
  setTimeout(() => (open.value = false), 150)
}

watch(
  () => props.autofocus,
  (v) => {
    if (v) inputEl.value?.focus()
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="searchbar">
    <span class="search-icon" aria-hidden="true">🔍</span>
    <input
      ref="inputEl"
      :value="modelValue"
      type="search"
      role="combobox"
      :aria-expanded="open"
      aria-label="Search"
      placeholder="Search the web…"
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
      @keydown="onKey"
      @focus="() => { if (suggestions.length) open = true }"
      @blur="onBlur"
    />
    <button v-if="modelValue" class="clear-btn" type="button" aria-label="Clear search" @click="emit('update:modelValue', '')">✕</button>
    <button class="go-btn" type="button" @click="submit()">Search</button>
    <ul v-if="open && suggestions.length" class="suggestions" role="listbox">
      <li
        v-for="(s, i) in suggestions"
        :key="s"
        role="option"
        :class="{ active: i === active }"
        @mousedown.prevent="submit(s)"
        @mouseenter="active = i"
      >
        {{ s }}
      </li>
    </ul>
  </div>
</template>
