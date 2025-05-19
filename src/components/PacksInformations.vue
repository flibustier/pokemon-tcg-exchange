<script setup lang="ts">
import { computed } from 'vue'

import { getWantedCardsAsArray } from '@/services/store'

const countByPack = (array: { packs?: string[]; count: number }[]): Record<string, number> => {
  return array.reduce(
    (acc, card) => {
      console.log(card)
      for (const pack of card.packs || []) {
        acc[pack || ''] = (acc[pack || ''] || 0) + card.count
      }
      return acc
    },
    {} as Record<string, number>,
  )
}

const countWantedByPack = computed(() => countByPack(getWantedCardsAsArray.value))
</script>

<template>
  <div class="prices" v-if="getWantedCardsAsArray.length > 0">
    <h3>ℹ️ Best packs matching your wishes :</h3>

    <div class="price" v-for="(index, pack) in countWantedByPack" :key="index">
      <div class="rarity">
        <img
          :src="`/images/packs/${pack}.webp`"
          :alt="pack"
          height="100px"
          :title="pack + ' booster pack'"
        />
      </div>
      <span>{{ countWantedByPack[pack] }} cards wanted inside</span>
    </div>
  </div>
</template>

<style scoped>
.prices {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  max-height: 500px;
  overflow-y: auto;
}

.price {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 16px;
  color: #5f6368;
}

.rarity {
  width: 100px;
  display: flex;
  justify-content: center;
}
</style>
