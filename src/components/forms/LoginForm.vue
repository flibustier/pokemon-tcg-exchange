<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { createUser, fetchUser, sendMagicLink } from '@/services/api'
import { serverText, t } from '@/services/i18n'
import { isCardsIncomplete, setLogin } from '@/services/store'

const props = defineProps({
  withoutId: {
    type: Boolean,
    default: false,
  },
  withoutPassword: {
    type: Boolean,
    default: false,
  },
})
watch(props, () => (submitError.value = null))

const emit = defineEmits(['error'])

const form = reactive({
  friendId: '',
  email: '',
  password: '',
})

const email = computed(() => form.email.toLowerCase())

const submitError = ref()
const submitting = ref(false)
const passwordSuccess = ref(false)

const CTA = computed(() => {
  if (submitting.value) return t('login.loading')
  if (props.withoutPassword) return t('login.sendLink')
  if (props.withoutId) return t('login.submitSignIn')

  return t('login.submitCreate')
})

const formIncomplete = computed(() => {
  if (!form.email || (!form.password && !props.withoutPassword)) {
    return true
  }
  if (props.withoutId) {
    return false
  }
  if (!form.friendId || form.friendId.length !== 16 || !/^\d+$/.test(form.friendId)) {
    return true
  }
  return false
})

const redirect = () => {
  window.location.replace(isCardsIncomplete.value ? '/account/wishlist' : '/account/proposals')
}

const submit = async () => {
  submitting.value = true
  try {
    if (props.withoutPassword) {
      passwordSuccess.value = (await sendMagicLink(email.value, form.friendId)) === 'ok'

      if (passwordSuccess.value) {
        form.email = ''
        form.friendId = ''
      }

      return
    }

    let success = false
    if (props.withoutId) {
      await setLogin(email.value, form.password)
      success = await fetchUser()
    } else {
      success = await createUser(form)
    }

    if (success) {
      redirect()
    }
  } catch (error) {
    if (error !== 'insufficient credentials') {
      submitError.value = error
    }
    emit('error', error)
  } finally {
    submitting.value = false
  }
}

if (!import.meta.env.SSR) {
  onMounted(async () => {
    const searchParams = new URLSearchParams(window.location.search)
    const email = searchParams.get('email')
    const token = searchParams.get('token')

    if (email && token) {
      await setLogin(email, '', token)
      const success = await fetchUser()
      if (success) {
        redirect()
      }
    }
  })
}
</script>

<template>
  <form class="friend-form" @submit.prevent="submit">
    <div class="form-group" v-if="!props.withoutId || props.withoutPassword">
      <label for="friendId" class="form-label">{{ t('login.friendId') }}</label>
      <input
        v-model="form.friendId"
        required
        type="text"
        id="friendId"
        class="friend-id"
        placeholder="0000000000000000"
        pattern="\d{16}"
        maxlength="16"
      />
    </div>
    <div class="form-group">
      <label for="email" class="form-label"
        >{{ t('login.email') }}
        <span v-if="!props.withoutId && !props.withoutPassword">{{
          t('login.emailHint')
        }}</span></label
      >
      <input
        type="email"
        id="email"
        class="email-input"
        :placeholder="t('login.emailPlaceholder')"
        v-model.trim="form.email"
        required
      />
    </div>
    <div class="form-group" v-if="!props.withoutPassword">
      <label for="password" class="form-label"
        >{{ t('login.password') }}
        <span v-if="!props.withoutId">{{ t('login.passwordHint') }}</span></label
      >
      <input
        v-model="form.password"
        required
        type="password"
        id="password"
        class="password-input"
        :placeholder="t('login.passwordPlaceholder')"
      />
    </div>
    <button type="submit" class="submit-button" :disabled="formIncomplete || submitting">
      {{ CTA }}
    </button>
    <div class="text-center">
      <p v-if="passwordSuccess" class="success-message">
        {{ t('login.linkSent') }}
      </p>
      <span v-if="submitError" class="error-message">{{
        t('login.error', { error: serverText(submitError) })
      }}</span>
      <router-link
        v-if="submitError === 'invalid password'"
        :to="'/forgotten-password?email=' + email"
      >
        {{ t('login.forgottenLink') }}
      </router-link>
    </div>
  </form>
</template>

<style scoped>
.friend-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
  padding-left: 16px;
}

.friend-id,
.email-input,
.password-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 25px;
  font-size: 14px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: all 0.2s ease;
}

.friend-id:focus,
.email-input:focus,
.password-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.friend-id::placeholder,
.email-input::placeholder,
.password-input::placeholder {
  color: var(--color-text-subtle);
}

/* Invalid state styling */
.friend-id:invalid,
.email-input:invalid {
  border-color: var(--color-danger);
}

.submit-button {
  background: var(--accent);
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  color: var(--on-accent);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--accent-shadow);
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 24px;
}

.submit-button:hover {
  background: var(--accent-hover);
  box-shadow: 0 6px 16px var(--accent-shadow-strong);
}

.submit-button:active {
  box-shadow: 0 2px 8px var(--accent-shadow);
}

.submit-button:disabled {
  background: var(--color-disabled);
  color: var(--on-disabled);
  cursor: not-allowed;
  box-shadow: none;
}

.text-center {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 1rem;
}

.error-message {
  color: var(--color-danger);
}

.success-message {
  color: var(--color-success);
}

a {
  color: var(--text-primary);
  text-decoration: none;
}
</style>
