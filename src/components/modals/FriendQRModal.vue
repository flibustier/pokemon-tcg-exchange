<script setup lang="ts">
import { ref, useId, watch } from 'vue'

import BaseModal from './BaseModal.vue'
import { renderFriendQRSVG } from '@/services/qr'
import { formatFriendID, friendQRPayload } from '@/services/utils'

const { friendID, pseudo } = defineProps<{
  friendID: string
  pseudo?: string
}>()

const isVisible = defineModel<boolean>()

const svg = ref('')
const id = useId()

watch(
  [isVisible, () => friendID],
  async ([visible]) => {
    if (!visible || !friendID) return
    // Loaded on demand to keep the QR library out of the main bundle
    const { encode } = await import('uqr')
    // High error correction, like the in-game code, so it still scans with the logo in the middle
    svg.value = renderFriendQRSVG(encode(friendQRPayload(friendID), { ecc: 'H', border: 0 }), id)
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
        <div>
          <p class="mb-0">In Pokemon TCG Pocket :</p>
          <ol>
            <li>open <strong>"Friends"</strong>,</li>
            <li>tap <strong>"Add Friend"</strong>,</li>
            <li>then <strong>"Scan Code"</strong>.</li>
          </ol>
        </div>
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

ol {
  li {
    width: fit-content;
  }
}

.mb-0 {
  margin-bottom: 0;
}
</style>
