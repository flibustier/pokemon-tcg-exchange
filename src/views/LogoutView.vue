<script setup lang="ts">
import CenteredLayout from '@/layouts/CenteredLayout.vue'
import { t } from '@/services/i18n'
import { setLogOut } from '@/services/store'

setLogOut()
window.location.replace('/')
</script>

<template>
  <CenteredLayout>
    <h1>{{ t('logout.title') }}</h1>
  </CenteredLayout>
</template>
