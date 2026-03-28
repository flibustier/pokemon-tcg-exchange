<script setup lang="ts">
import { useRoute } from 'vue-router'
import BaseModal from '@/components/modals/BaseModal.vue'

defineProps<{
  sets: { code: string; name: { en: string }; imagePath: string }[]
}>()

const isVisible = defineModel<boolean>()
const route = useRoute()

const selectSet = () => {
  isVisible.value = false
}
</script>

<template>
  <BaseModal v-model="isVisible" title="Select a Set">
    <div class="set-grid">
      <a
        v-for="set in sets"
        :key="set.code"
        :href="'#' + set.code"
        class="set-item"
        :class="{ active: route.hash === '#' + set.code }"
        @click="selectSet"
        :title="set.name?.en"
      >
        <img :src="set.imagePath" :alt="set.name?.en" class="set-image" loading="lazy" />
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
  background-color: #f0f0f0;
  transform: scale(1.05);
}

.set-item.active {
  background-color: #e0e0e0;
  border: 2px solid var(--primary-color, #007bff);
  transform: scale(1.05);
}

.set-image {
  max-width: 100%;
  height: auto;
  max-height: 80px;
  object-fit: contain;
}
</style>
