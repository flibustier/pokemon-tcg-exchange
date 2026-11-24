<script setup lang="ts">
import { t } from '@/services/i18n'
import { toggleTheme } from '@/services/theme'

import MoonIcon from '@/components/icons/MoonIcon.vue'
import SunIcon from '@/components/icons/SunIcon.vue'
</script>

<template>
  <!-- Both icons are rendered, the theme's CSS variables show one: the pre-rendered page is right
       before the script runs, whatever the theme. The menu has its own item, see MenuModal. -->
  <button type="button" class="theme-toggle" @click="toggleTheme">
    <span class="if-light" :title="t('theme.toDark')">
      <MoonIcon />
      <span class="visually-hidden">{{ t('theme.toDark') }}</span>
    </span>
    <span class="if-dark" :title="t('theme.toLight')">
      <SunIcon />
      <span class="visually-hidden">{{ t('theme.toLight') }}</span>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
}

.theme-toggle:hover {
  background-color: var(--hover-tint);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-toggle svg {
  display: block;
  width: 22px;
  height: 22px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
