<script setup lang="ts">
import { CATEGORY_TABS } from '../types'

defineProps<{ active: string }>()
const emit = defineEmits<{ (e: 'select', id: string): void }>()
</script>

<template>
  <nav class="tabs" aria-label="Search category">
    <button
      v-for="t in CATEGORY_TABS"
      :key="t.id"
      type="button"
      :class="{ active: active === t.id }"
      :aria-current="active === t.id ? 'page' : undefined"
      @click="emit('select', t.id)"
    >
      {{ t.label }}
    </button>
  </nav>
</template>
