<script setup lang="ts">
import { useRouter } from 'vue-router'

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
    <h2>Access to Beta features</h2>

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
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}
</style>
