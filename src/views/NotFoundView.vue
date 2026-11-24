<script setup lang="ts">
import { t } from '@/services/i18n'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'
</script>

<template>
  <CenteredLayout>
    <h1 style="margin-bottom: 2rem">{{ t('notFound.title') }}</h1>
    <PlainButton @click="$router.push('/')">{{ t('notFound.home') }}</PlainButton>
  </CenteredLayout>
</template>
