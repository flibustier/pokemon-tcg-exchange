<script setup lang="ts">
import { computed } from 'vue'

import RarityImage from '@/components/atoms/RarityImage.vue'

import { rarityLabels } from '@/services/cards'
import type { Card } from '@/services/cards'

const props = defineProps<{
  cards: Card[]
}>()

const filters = defineModel<{
  hideUnavailable: boolean
  hideEmpty: boolean
  raritySelection: string[]
}>({
  required: true,
})

const rarityOptions = computed(() => {
  return Array.from(new Set(props.cards.map((card) => card.rarityCode)))
})

const toggle = (rarity: string) => {
  if (filters.value.raritySelection.includes(rarity)) {
    filters.value.raritySelection = filters.value.raritySelection.filter((r) => r !== rarity)
  } else {
    filters.value.raritySelection.push(rarity)
  }
}
</script>

<template>
  <div class="filters">
    <div
      class="badge"
      :class="{
        'is-active':
          filters.raritySelection.includes(rarity) || filters.raritySelection.length === 0,
      }"
      v-for="rarity in rarityOptions"
      :key="rarity"
      :title="rarityLabels[rarity as keyof typeof rarityLabels] || ''"
      @click="toggle(rarity)"
    >
      <RarityImage :rarity="rarity" />
    </div>
    <div
      class="badge badge--unavailable"
      :class="{ 'is-active': !filters.hideUnavailable }"
      title="Display restricted cards or cards you’re already looking for"
      @click="filters.hideUnavailable = !filters.hideUnavailable"
    >
      🚫
    </div>
    <div
      class="badge badge--unavailable"
      :class="{ 'is-active': !filters.hideEmpty }"
      title="Display cards you haven’t already selected"
      @click="filters.hideEmpty = !filters.hideEmpty"
    >
      0️⃣
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  height: 25px;
  padding: 0.2rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.badge--unavailable {
  margin-left: 1rem;
  height: 30px;
}

.badge.is-active {
  background-color: #e6f9f2;
  box-shadow:
    0 2px 8px 0 rgba(60, 60, 120, 0.18),
    inset 0 2px 8px 0 rgba(60, 60, 120, 0.16);
  border-color: transparent;
}
</style>
