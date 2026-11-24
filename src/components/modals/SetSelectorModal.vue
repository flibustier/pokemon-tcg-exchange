<script setup lang="ts">
import { useRoute } from 'vue-router'
import BaseModal from '@/components/modals/BaseModal.vue'
import { setLogo, setName, t, type SetNames } from '@/services/i18n'

defineProps<{
  sets: { code: string; name: SetNames; imagePath: string }[]
}>()

const isVisible = defineModel<boolean>()
const route = useRoute()

const selectSet = () => {
  isVisible.value = false
}
</script>

<template>
  <BaseModal v-model="isVisible" :title="t('sets.select')">
    <div class="set-grid">
      <a
        v-for="set in sets"
        :key="set.code"
        :href="'#' + set.code"
        class="set-item"
        :class="{ active: route.hash === '#' + set.code }"
        @click="selectSet"
        :title="setName(set)"
      >
        <img :src="setLogo(set)" :alt="setName(set)" class="set-image" loading="lazy" />
      </a>
    </div>
  </BaseModal>
</template>

<style scoped>
.set-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  gap: 1rem;
  max-width: 50rem;
  max-height: 70vh;
  overflow-y: auto;
}

.set-item {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  transition:
    background-color 0.2s,
    transform 0.2s;
  cursor: pointer;
  text-decoration: none;
}

.set-item:hover {
  background-color: var(--color-surface-mute);
  transform: scale(1.05);
}

.set-item.active {
  background-color: var(--color-surface-strong);
  border: 2px solid var(--primary-color);
  transform: scale(1.05);
}

.set-image {
  max-width: 100%;
  height: auto;
  max-height: 80px;
  object-fit: contain;
}
</style>
