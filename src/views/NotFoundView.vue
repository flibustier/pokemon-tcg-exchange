<script setup lang="ts">
import CenteredLayout from '@/layouts/CenteredLayout.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'
</script>

<template>
  <CenteredLayout>
    <h1 style="margin-bottom: 2rem">404: Page not found :/</h1>
    <PlainButton @click="$router.push('/')">Return to the home</PlainButton>
  </CenteredLayout>
</template>
