<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { createUser, fetchUser } from '@/services/api'
import { getFriendId } from '@/services/store'

const props = defineProps({
  withoutId: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['error'])

const form = reactive({
  friendId: getFriendId(),
  email: '',
  password: '',
})

const submitError = ref()
const submitting = ref(false)

const formIncomplete = computed(() => {
  if (!form.email || !form.password) {
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

const submit = async () => {
  submitting.value = true
  try {
    let success = false
    if (props.withoutId) {
      success = await fetchUser(form)
    } else {
      success = await createUser(form)
    }

    console.log(success)

    if (success) {
      window.location.replace('/account/proposals')
    }
  } catch (error) {
    if (error !== 'user not found') {
      submitError.value = error
    }
    emit('error', error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="friend-form" @submit.prevent="submit">
    <div class="form-group" v-if="!props.withoutId">
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
        <span v-if="!props.withoutId">(for notifications about exchange proposals)</span></label
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
    <div class="form-group">
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
      {{ submitting ? 'Loading…' : props.withoutId ? 'Sign In' : 'Create Account' }}
    </button>
    <span class="error-message" v-if="submitError">Error: {{ submitError }}</span>
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

.error-message {
  color: #ff5252;
  padding: 8px 16px;
  margin-top: 4px;
  font-weight: 500;
  text-align: center;
}
</style>
