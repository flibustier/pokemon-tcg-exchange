<script setup lang="ts">
import { sitePath, t } from '@/services/i18n'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'

// A public page, outside the app
const goHome = () => location.assign(sitePath('/'))
</script>

<template>
  <CenteredLayout>
    <h1 style="margin-bottom: 2rem">{{ t('notFound.title') }}</h1>
    <PlainButton @click="goHome">{{ t('notFound.home') }}</PlainButton>
  </CenteredLayout>
</template>
