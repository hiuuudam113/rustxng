<script setup lang="ts">
import type { Settings } from '../types'

const props = defineProps<{ settings: Settings; backendOk: boolean | null }>()
const emit = defineEmits<{
  (e: 'update', s: Settings): void
  (e: 'check'): void
}>()

function set<K extends keyof Settings>(key: K, value: Settings[K]) {
  emit('update', { ...props.settings, [key]: value })
}
</script>

<template>
  <details class="settings">
    <summary>⚙️ Settings</summary>
    <div class="settings-grid">
      <label>
        Backend URL
        <input
          type="url"
          :value="settings.backendBase"
          placeholder="http://127.0.0.1:29483"
          @change="(e) => set('backendBase', (e.target as HTMLInputElement).value.trim())"
        />
        <small>
          In dev/preview the Vite proxy target is fixed at startup from
          <code>VITE_RUSTXNG_BASE_URL</code> — restart dev after changing it.
          <span v-if="backendOk === true"> · ✓ backend reachable</span>
          <span v-else-if="backendOk === false"> · ✕ backend unreachable</span>
        </small>
      </label>
      <label>
        Results per page
        <select :value="settings.perPage" @change="(e) => set('perPage', Number((e.target as HTMLSelectElement).value) as 10 | 20 | 30)">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="30">30</option>
        </select>
      </label>
      <label>
        SafeSearch
        <select :value="settings.safesearch" @change="(e) => set('safesearch', Number((e.target as HTMLSelectElement).value) as 0 | 1 | 2)">
          <option :value="0">Off</option>
          <option :value="1">Moderate</option>
          <option :value="2">Strict</option>
        </select>
      </label>
      <label>
        Time range
        <select :value="settings.timeRange" @change="(e) => set('timeRange', (e.target as HTMLSelectElement).value as Settings['timeRange'])">
          <option value="">Any time</option>
          <option value="day">Past day</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
          <option value="year">Past year</option>
        </select>
      </label>
      <label>
        Language
        <select :value="settings.language" @change="(e) => set('language', (e.target as HTMLSelectElement).value)">
          <option value="">Auto</option>
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="ja">日本語</option>
        </select>
      </label>
      <button class="check-btn" type="button" @click="emit('check')">Check backend</button>
    </div>
  </details>
</template>
