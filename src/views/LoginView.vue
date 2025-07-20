<script setup lang="ts">
import { ref } from 'vue'

import LoginForm from '@/components/forms/LoginForm.vue'

const hasAccount = ref(true)

function handleError(error: string) {
  console.log('error', error)
  if (error === 'user not found') {
    hasAccount.value = false
  }
}
</script>

<template>
  <div class="about">
    <div class="form">
      <h2 v-if="hasAccount">Sign in to your account</h2>
      <h2 v-else>Create your account</h2>
      <LoginForm :without-id="hasAccount" @error="handleError" />
      <p v-if="hasAccount">
        Don't have an account yet? <a href="#" @click="hasAccount = false">Create an account</a>
      </p>
      <p v-else>Already have an account? <a href="#" @click="hasAccount = true">Sign in →</a></p>
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
  box-shadow: 0 0 0 2px #5fd5ff;
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
