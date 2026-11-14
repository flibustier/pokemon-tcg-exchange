<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { changeEmail, refreshEmailStatus, resendConfirmationEmail } from '@/services/api'
import { userInfo } from '@/services/store'

const RESENT = 'sent'

const feedback = ref('')
const isEditing = ref(false)
const newEmail = ref('')
const isBusy = ref(false)

const errorText = (error: unknown) =>
  error === 'ko' || typeof error !== 'string' ? 'the server is busy, please try again' : error

const resend = async () => {
  isBusy.value = true
  try {
    const result = await resendConfirmationEmail()
    feedback.value = result === RESENT ? 'A new email is on its way!' : errorText(result)
  } catch (error) {
    feedback.value = errorText(error)
  } finally {
    isBusy.value = false
  }
}

const editEmail = () => {
  newEmail.value = userInfo.value.email || ''
  feedback.value = ''
  isEditing.value = true
}

const saveEmail = async () => {
  isBusy.value = true
  try {
    const result = await changeEmail(newEmail.value)
    if (result === 'updated') {
      isEditing.value = false
      feedback.value = 'Email updated, a new confirmation email is on its way!'
    } else {
      feedback.value = errorText(result)
    }
  } catch (error) {
    feedback.value = errorText(error)
  } finally {
    isBusy.value = false
  }
}

// The link is often opened on another device or in another tab: check again when the player
// comes back to this one.
const refreshOnReturn = () => {
  if (document.visibilityState === 'visible') refreshEmailStatus().catch(() => {})
}
onMounted(() => document.addEventListener('visibilitychange', refreshOnReturn))
onUnmounted(() => document.removeEventListener('visibilitychange', refreshOnReturn))
</script>

<template>
  <div class="email-banner" role="status">
    <p>
      📧 Please confirm your email: we sent a link to <strong>{{ userInfo.email }}</strong
      >. Until then, you won't receive notifications and can't send messages.
    </p>
    <form v-if="isEditing" class="edit" @submit.prevent="saveEmail">
      <input
        v-model.trim="newEmail"
        type="email"
        required
        aria-label="New email address"
        placeholder="Enter your email"
      />
      <button type="submit" :disabled="isBusy || !newEmail">Save</button>
      <button type="button" class="link" @click="isEditing = false">Cancel</button>
    </form>
    <div v-else class="actions">
      <button type="button" class="link" :disabled="isBusy" @click="resend">
        Resend the email
      </button>
      ·
      <button type="button" class="link" @click="editEmail">Wrong address? Change it</button>
    </div>
    <p v-if="feedback" class="feedback">{{ feedback }}</p>
  </div>
</template>

<style scoped>
.email-banner {
  margin: 0 auto 1rem;
  max-width: 800px;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background-color: #fff8e1;
  box-shadow: 0 0 0 1px #ffe08a;
  color: #5f4b00;
  text-align: center;
}

.actions,
.edit {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.edit input {
  min-width: 240px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
}

.edit button[type='submit'] {
  padding: 6px 16px;
  border: none;
  border-radius: 25px;
  background: #5fd5ff;
  color: white;
  cursor: pointer;
}

.edit button[type='submit']:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
}

.link {
  border: none;
  background: none;
  padding: 0;
  color: var(--text-primary);
  font-size: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.link:disabled {
  opacity: 0.5;
  cursor: wait;
}

.feedback {
  margin-top: 0.5rem;
  font-weight: 500;
}
</style>
