<script setup lang="ts">
import { t } from '@/services/i18n'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import SiteLink from '@/components/atoms/SiteLink.vue'
</script>

<template>
  <CenteredLayout>
    <h1 style="margin-bottom: 2rem">{{ t('notFound.title') }}</h1>
    <SiteLink to="/">{{ t('notFound.home') }}</SiteLink>
  </CenteredLayout>
</template>
