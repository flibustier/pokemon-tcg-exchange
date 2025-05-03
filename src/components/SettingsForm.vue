<script setup lang="ts">
import { ref } from 'vue'

import PlainButton from '@/components/atoms/PlainButton.vue'
import CenteredLayout from '@/layouts/CenteredLayout.vue'

import { getFriendId, setFriendId } from '@/services/store'
import { updateUser } from '@/services/api'

const friendId = ref(getFriendId())

const save = async () => {
  setFriendId(friendId.value)
  await updateUser()
}
</script>

<template>
  <CenteredLayout>
    <h2>Settings</h2>
    <form class="friend-form" @submit.prevent="save">
      <div class="form-group">
        <label for="friendId" class="form-label">Friend ID (16 digits without "-")</label>
        <input
          v-model="friendId"
          required
          type="text"
          id="friendId"
          class="friend-id"
          placeholder="0000000000000000"
          pattern="\d{16}"
          maxlength="16"
        />
      </div>
      <PlainButton type="submit" role="button">Save</PlainButton>
    </form>
  </CenteredLayout>
</template>

<style scoped>
h2 {
  margin-bottom: 2rem;
}

.friend-form {
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
</style>
