<script setup lang="ts">
import { computed } from 'vue'

const { friendID } = defineProps<{
  icon?: string
  pseudo?: string
  language?: string
  friendID: string
  withoutBorder?: boolean
}>()

const formattedFriendID = computed(() => {
  return friendID.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')
})
</script>

<template>
  <div class="user-badge" :class="{ 'with-border': !withoutBorder }">
    <img v-if="icon && icon !== '000'" :src="`/images/avatars/${icon}.png`" height="40px" alt="" />
    <div>
      <div v-if="pseudo">
        {{ pseudo }} <span v-if="language && false">({{ language }})</span>
      </div>
      <div>ID {{ formattedFriendID }}</div>
    </div>
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
</style>
