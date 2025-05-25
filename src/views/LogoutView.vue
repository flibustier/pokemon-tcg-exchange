<script setup lang="ts">
import CenteredLayout from '@/layouts/CenteredLayout.vue'
import { setLogOut } from '@/services/store'

if (!import.meta.env.SSR) {
  setLogOut()

  window.location.replace('/')
}
</script>

<template>
  <CenteredLayout>
    <h1>Logging out...</h1>
  </CenteredLayout>
</template>
