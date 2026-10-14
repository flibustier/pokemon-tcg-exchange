<script setup lang="ts">
import { ref, watch } from 'vue'

import BaseModal from './BaseModal.vue'
import { formatFriendID, friendQRPayload } from '@/services/utils'

const { friendID, pseudo } = defineProps<{
  friendID: string
  pseudo?: string
}>()

const isVisible = defineModel<boolean>()

const svg = ref('')

watch(
  [isVisible, () => friendID],
  async ([visible]) => {
    if (!visible || !friendID) return
    // Loaded on demand to keep the QR library out of the main bundle
    const { renderSVG } = await import('uqr')
    svg.value = renderSVG(friendQRPayload(friendID), { ecc: 'M', border: 4 })
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <BaseModal v-model="isVisible" :title="pseudo ? `Add ${pseudo}` : 'Add friend'">
      <div class="friend-qr">
        <div
          class="qr-code"
          v-html="svg"
          role="img"
          :aria-label="`QR code for ID ${formatFriendID(friendID)}`"
        ></div>
        <div class="friend-id">ID {{ formatFriendID(friendID) }}</div>
        <p>
          In Pokemon TCG Pocket, open <strong>Friends</strong>, tap <strong>Add Friend</strong>,
          then <strong>Scan Code</strong>.
        </p>
      </div>
    </BaseModal>
  </Teleport>
</template>

<style scoped>
.friend-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
}

.qr-code {
  width: min(280px, 70vw);
  aspect-ratio: 1;
  background: white;
}

.qr-code :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.friend-id {
  font-weight: 500;
  color: #5f6368;
}
</style>
