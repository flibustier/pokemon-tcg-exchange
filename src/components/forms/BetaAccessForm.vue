<script setup lang="ts">
import { useRouter } from 'vue-router'

import { t } from '@/services/i18n'
import { getUserInfo, setUserInfo } from '@/services/store'
import { updateUser } from '@/services/api'

import GitHubStargazer from '@/components/GitHubStargazer.vue'

const router = useRouter()

const grantBetaAccess = async (ghUsername: string) => {
  setUserInfo({
    ...getUserInfo(),
    has_beta_access: true,
    github_username: ghUsername,
  })

  await updateUser()

  router.back()
}
</script>

<template>
  <div class="form">
    <h2>{{ t('beta.title') }}</h2>

    <GitHubStargazer @success="grantBetaAccess" />
  </div>
</template>

<style scoped>
h2 {
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
  background: var(--color-surface-soft);
  border-radius: 12px;
  box-shadow: 0 4px 8px var(--shadow-color);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}
</style>
