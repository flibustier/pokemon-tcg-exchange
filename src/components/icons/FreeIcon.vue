<!-- A crossed out coin, in euros unless told otherwise -->
<script setup lang="ts">
defineProps<{ currency?: '€' | '$' }>()
</script>

<template>
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="9.5" />
    <path
      v-if="currency === '$'"
      d="M14.6 9.6C14.2 8.6 13.2 8 12 8c-1.5 0-2.7.8-2.7 2 0 2.8 5.4 1.2 5.4 4 0 1.2-1.2 2-2.7 2-1.2 0-2.2-.6-2.6-1.6M12 6.3V8M12 16v1.7"
    />
    <path v-else d="M15 9.2a4 4 0 1 0 0 5.6M7.5 11h4M7.5 13h4" />
    <path d="M4 20L20 4" />
  </svg>
</template>
