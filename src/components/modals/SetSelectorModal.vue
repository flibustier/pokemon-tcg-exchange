<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import PrimaryButton from '@/components/atoms/PrimaryButton.vue'
interface Set {
  id: string
  name: string
  releaseDate: string
}
const isVisible = ref(false)
const selectedSet = ref<string | null>(null)
const sets = ref<Set[]>([
  { id: 'base', name: 'Base Set', releaseDate: '1999-01-09' },
  { id: 'jungle', name: 'Jungle', releaseDate: '1999-06-16' },
  { id: 'fossil', name: 'Fossil', releaseDate: '1999-10-10' },
  // Add more sets as needed
])
const selectSet = (setId: string) => {
  selectedSet.value = setId
}
const confirmSelection = () => {
  if (selectedSet.value) {
    // Handle the selected set (e.g., emit an event or update a store)
    isVisible.value = false
  }
}
</script>

<template>
  <BaseModal v-model:isVisible="isVisible" title="Select a Set">
    <div class="set-selector">
      <div class="set-list">
        <div
          v-for="set in sets"
          :key="set.id"
          class="set-item"
          :class="{ selected: selectedSet === set.id }"
          @click="selectSet(set.id)"
        >
          <img :src="`/images/sets/${set.id}.png`" :alt="set.name" class="set-image" />
          <div class="set-info">
            <h3 class="set-name">{{ set.name }}</h3>
            <p class="set-release-date">Released: {{ set.releaseDate }}</p>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <PrimaryButton @click="confirmSelection" :disabled="!selectedSet">Confirm</PrimaryButton>
      </div>
    </div>
  </BaseModal>
</template>
