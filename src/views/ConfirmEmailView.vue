<script setup lang="ts">
import { onMounted, ref } from 'vue'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'

import { confirmEmail, refreshEmailStatus, resendConfirmationEmail } from '@/services/api'
import { getUserInfo, isEmailPending, isLogged, setUserInfo } from '@/services/store'

const state = ref<'confirming' | 'confirmed' | 'invalid' | 'error'>('confirming')
const resent = ref('')

const confirm = async (token: string) => {
  state.value = 'confirming'
  try {
    const result = await confirmEmail(token)
    if (result === 'confirmed') {
      state.value = 'confirmed'
      if (isLogged()) {
        setUserInfo({ ...getUserInfo(), email_status: 'verified' })
        // The session loaded by App may have been read before the confirmation
        refreshEmailStatus().catch(() => {})
      }
    } else {
      state.value = result === 'ko' ? 'error' : 'invalid'
    }
  } catch {
    state.value = 'error'
  }
}

const resend = async () => {
  try {
    const result = await resendConfirmationEmail()
    resent.value = result === 'sent' ? 'A new email is on its way!' : result
  } catch {
    resent.value = 'the server is busy, please try again'
  }
}

let token = ''
if (!import.meta.env.SSR) {
  onMounted(() => {
    // The token comes after the # of the link, which no request carries. Remove it from the
    // address bar too, so that it stays out of the history and of a copied link.
    token = new URLSearchParams(window.location.hash.slice(1)).get('token') || ''
    if (window.location.hash) {
      history.replaceState(history.state, '', window.location.pathname)
    }
    if (token) {
      confirm(token)
    } else {
      state.value = 'invalid'
    }
  })
}
</script>

<template>
  <CenteredLayout>
    <div class="confirm">
      <template v-if="state === 'confirming'">
        <h2>Confirming your email…</h2>
      </template>

      <template v-else-if="state === 'confirmed'">
        <h2>Your email is confirmed! 🎉</h2>
        <p>You will now receive notifications and can send messages to other players.</p>
        <PlainButton v-if="isLogged()" @click="$router.push('/account/proposals')">
          See my proposals
        </PlainButton>
        <PlainButton v-else @click="$router.push('/login')">Sign in</PlainButton>
      </template>

      <template v-else-if="state === 'invalid'">
        <h2>This link is invalid or expired</h2>
        <template v-if="isLogged() && isEmailPending">
          <p>Links work for 48 hours. You can ask for a new one:</p>
          <PlainButton @click="resend">Send a new email</PlainButton>
          <p v-if="resent" class="feedback">{{ resent }}</p>
        </template>
        <p v-else-if="isLogged()">
          Your email may already be confirmed:
          <router-link to="/account/settings">check your account</router-link>.
        </p>
        <p v-else>
          Links work for 48 hours. <router-link to="/login">Sign in</router-link> to ask for a new
          one.
        </p>
      </template>

      <template v-else>
        <h2>The server is busy</h2>
        <p>Your email is not confirmed yet, please try again in a moment.</p>
        <PlainButton @click="confirm(token)">Try again</PlainButton>
      </template>
    </div>
  </CenteredLayout>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 500px;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 0 0 2px #5fd5ff;
  text-align: center;
}

h2 {
  font-size: 1.5rem;
  font-weight: 500;
}

a {
  color: var(--text-primary);
}

.feedback {
  font-weight: 500;
}
</style>
