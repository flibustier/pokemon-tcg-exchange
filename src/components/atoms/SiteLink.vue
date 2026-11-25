<script setup lang="ts">
import { computed } from 'vue'

import { savePending } from '@/services/api'
import { sitePath } from '@/services/i18n'

// A link to a public page, outside the app: the browser leaves the app for it
const { to } = defineProps<{ to: string }>()

const href = computed(() => sitePath(to))

const leave = async (event: MouseEvent) => {
  // Opened in another tab, the app stays
  if (event.button || event.ctrlKey || event.metaKey || event.shiftKey) return
  event.preventDefault()
  await savePending()
  location.assign(href.value)
}
</script>

<template>
  <a :href @click="leave"><slot /></a>
</template>
