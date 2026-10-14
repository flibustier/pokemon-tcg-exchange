<script setup lang="ts">
import { computed, ref } from 'vue'

import FriendQRModal from '@/components/modals/FriendQRModal.vue'
import { formatFriendID } from '@/services/utils'

const { friendID, pseudo } = defineProps<{
  icon?: string
  pseudo?: string
  language?: string
  friendID: string
  withoutBorder?: boolean
  lastUpdate?: string
}>()

const formattedFriendID = computed(() => formatFriendID(friendID))

const isQRVisible = ref(false)

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="user-badge" :class="{ 'with-border': !withoutBorder }">
    <img v-if="icon && icon !== '000'" :src="`/images/avatars/${icon}.png`" height="40px" alt="" />
    <div>
      <div v-if="pseudo">
        {{ pseudo }} <span v-if="language && false">({{ language }})</span>
      </div>
      <div style="display: flex">
        ID {{ formattedFriendID }}
        <button @click="copyToClipboard(friendID)" class="copy-button" title="Copy ID">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button @click="isQRVisible = true" class="copy-button" title="Show QR code">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <path d="M14 14h3v3h-3zM20 14v1M14 20h1M17 17h4v4h-4z"></path>
          </svg>
        </button>
      </div>
      <div
        v-if="lastUpdate"
        class="time"
        :title="`The last update from this user is ` + lastUpdate"
      >
        {{ lastUpdate }}
      </div>
    </div>
    <FriendQRModal v-model="isQRVisible" :friendID :pseudo />
  </div>
</template>

<style scoped>
.user-badge {
  background: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-badge.with-border {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.time {
  font-size: 11px;
  color: #888;
}

.copy-button {
  background: none;
  border: none;
  padding: 0;
  margin-left: 6px;
  cursor: pointer;
  color: #5f6368;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
