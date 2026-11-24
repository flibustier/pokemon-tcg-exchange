<script setup lang="ts">
import { LOCALES, locale, setLocale, t, type Locale } from '@/services/i18n'

const pick = (event: Event) => setLocale((event.target as HTMLSelectElement).value as Locale)
</script>

<template>
  <select class="language" :aria-label="t('app.language')" :value="locale" @change="pick">
    <option v-for="(name, code) in LOCALES" :key="code" :value="code" :lang="code">
      {{ name }}
    </option>
  </select>
</template>

<style scoped>
.language {
  padding: 0.25rem;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-primary);
  font: inherit;
  cursor: pointer;
}

.language:hover {
  background-color: var(--hover-tint);
}

.language:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* The list opens on the page's own colors, not on a transparent background */
.language option {
  color: var(--color-text);
  background-color: var(--color-surface);
}
</style>
