<script setup lang="ts">
import { onMounted, ref } from 'vue'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'
import RichText from '@/components/atoms/RichText'

import { confirmEmail, refreshEmailStatus, resendConfirmationEmail } from '@/services/api'
import { serverText, t } from '@/services/i18n'
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
    resent.value = result === 'sent' ? t('confirm.sent') : serverText(result)
  } catch {
    resent.value = serverText('ko')
  }
}

let token = ''
onMounted(() => {
  // The token comes after the # of the link, which no request carries. Remove it from the address
  // bar too, so that it stays out of the history and of a copied link.
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
</script>

<template>
  <CenteredLayout>
    <div class="confirm">
      <template v-if="state === 'confirming'">
        <h2>{{ t('confirm.confirming') }}</h2>
      </template>

      <template v-else-if="state === 'confirmed'">
        <h2>{{ t('confirm.confirmed') }}</h2>
        <p>{{ t('confirm.confirmedText') }}</p>
        <PlainButton v-if="isLogged()" @click="$router.push('/account/proposals')">
          {{ t('confirm.seeProposals') }}
        </PlainButton>
        <PlainButton v-else @click="$router.push('/login')">{{ t('confirm.signIn') }}</PlainButton>
      </template>

      <template v-else-if="state === 'invalid'">
        <h2>{{ t('confirm.invalid') }}</h2>
        <template v-if="isLogged() && isEmailPending">
          <p>{{ t('confirm.askNew') }}</p>
          <PlainButton @click="resend">{{ t('confirm.sendNew') }}</PlainButton>
          <p v-if="resent" class="feedback">{{ resent }}</p>
        </template>
        <p v-else-if="isLogged()">
          <RichText text="confirm.maybeConfirmed">
            <template #link="{ text }">
              <router-link to="/account/settings">{{ text }}</router-link>
            </template>
          </RichText>
        </p>
        <p v-else>
          <RichText text="confirm.signInToAsk">
            <template #link="{ text }">
              <router-link to="/login">{{ text }}</router-link>
            </template>
          </RichText>
        </p>
      </template>

      <template v-else>
        <h2>{{ t('confirm.busy') }}</h2>
        <p>{{ t('confirm.busyText') }}</p>
        <PlainButton @click="confirm(token)">{{ t('confirm.retry') }}</PlainButton>
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
  box-shadow: 0 0 0 2px var(--accent);
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
