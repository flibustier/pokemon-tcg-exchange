<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { createUser, fetchUser, sendMagicLink } from '@/services/api'
import { isAccountIncomplete, setLogin } from '@/services/store'

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

const submitError = ref()
const submitting = ref(false)
const passwordSuccess = ref(false)

const CTA = computed(() => {
  if (submitting.value) return 'Loading…'
  if (props.withoutPassword) return 'Send Magic Link'
  if (props.withoutId) return 'Sign In'

  return 'Create Account'
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
  window.location.replace(isAccountIncomplete.value ? '/account/wishlist' : '/account/proposals')
}

const submit = async () => {
  submitting.value = true
  try {
    if (props.withoutPassword) {
      passwordSuccess.value = (await sendMagicLink(form.email, form.friendId)) === 'ok'

      if (passwordSuccess.value) {
        form.email = ''
        form.friendId = ''
      }

      return
    }

    let success = false
    if (props.withoutId) {
      await setLogin(form.email, form.password)
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
      <label for="friendId" class="form-label">Friend ID (16 digits without "-")</label>
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
        >Email address
        <span v-if="!props.withoutId && !props.withoutPassword"
          >(for notifications about exchange proposals)</span
        ></label
      >
      <input
        type="email"
        id="email"
        class="email-input"
        placeholder="Enter your email"
        v-model="form.email"
        required
      />
    </div>
    <div class="form-group" v-if="!props.withoutPassword">
      <label for="password" class="form-label"
        >Password <span v-if="!props.withoutId">(for retrieving your data later)</span></label
      >
      <input
        v-model="form.password"
        required
        type="password"
        id="password"
        class="password-input"
        placeholder="Enter your password"
      />
    </div>
    <button type="submit" class="submit-button" :disabled="formIncomplete || submitting">
      {{ CTA }}
    </button>
    <div class="text-center">
      <p v-if="passwordSuccess" class="success-message">
        An email will be sent with a link to signin !
      </p>
      <span v-if="submitError" class="error-message">Error: {{ submitError }}</span>
      <router-link
        v-if="submitError === 'invalid password'"
        :to="'/forgotten-password?email=' + form.email"
      >
        Forgotten password?
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
  color: #5f6368;
  font-weight: 500;
  padding-left: 16px;
}

.friend-id,
.email-input,
.password-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
  color: #5f6368;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.friend-id:focus,
.email-input:focus,
.password-input:focus {
  outline: none;
  border-color: #5fd5ff;
  box-shadow: 0 0 0 2px rgba(95, 213, 255, 0.2);
}

.friend-id::placeholder,
.email-input::placeholder,
.password-input::placeholder {
  color: #9e9e9e;
}

/* Invalid state styling */
.friend-id:invalid,
.email-input:invalid {
  border-color: #ff5252;
}

.submit-button {
  background: #5fd5ff;
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(95, 213, 255, 0.2);
  transition: all 0.2s ease;
  width: 100%;
  margin-top: 24px;
}

.submit-button:hover {
  background: #4cccff;
  box-shadow: 0 6px 16px rgba(95, 213, 255, 0.3);
}

.submit-button:active {
  box-shadow: 0 2px 8px rgba(95, 213, 255, 0.2);
}

.submit-button:disabled {
  background: #e0e0e0;
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
  color: #ff5252;
}

.success-message {
  color: #4caf50;
}

a {
  color: var(--text-primary);
  text-decoration: none;
}
</style>
