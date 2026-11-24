<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { t } from '@/services/i18n'

import RichText from '@/components/atoms/RichText'
import LoginForm from '@/components/forms/LoginForm.vue'

const route = useRoute()
const isPasswordRequest = () => route.path === '/forgotten-password'
watch(route, () => (passwordRequest.value = isPasswordRequest()))

const hasAccount = ref(true)
const passwordRequest = ref(isPasswordRequest())

function handleError(error: string) {
  console.log('error', error)
  if (error === 'insufficient credentials') {
    hasAccount.value = false
  }
}
</script>

<template>
  <div class="about">
    <div class="form">
      <h2 v-if="passwordRequest">{{ t('login.forgotten') }}</h2>
      <h2 v-else-if="hasAccount">{{ t('login.signIn') }}</h2>
      <h2 v-else>{{ t('login.create') }}</h2>
      <LoginForm
        :without-id="hasAccount"
        :without-password="passwordRequest"
        @error="handleError"
      />
      <p v-if="hasAccount">
        <RichText text="login.noAccount">
          <template #link="{ text }">
            <a href="#" @click="hasAccount = false">{{ text }}</a>
          </template>
        </RichText>
      </p>
      <p v-else>
        <RichText text="login.hasAccount">
          <template #link="{ text }">
            <a href="#" @click="hasAccount = true">{{ text }}</a>
          </template>
        </RichText>
      </p>
    </div>
  </div>
</template>

<style scoped>
.about {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;

  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 0 0 2px var(--accent);
}

h2 {
  font-size: 1.5rem;
  font-weight: 500;
}

a {
  color: var(--text-primary);
  text-decoration: none;
}
</style>
