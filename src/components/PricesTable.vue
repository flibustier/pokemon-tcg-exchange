<script setup lang="ts">
import { computed } from 'vue'

import { getGivingCardsAsArray, getWantedCardsAsArray } from '@/services/store'

import RarityImage from '@/components/atoms/RarityImage.vue'

const props = defineProps({
  showGiving: {
    type: Boolean,
    default: false,
  },
})

const costByRarity = {
  R: 120,
  RR: 500,
  AR: 400,
}

const countByRarity = (array: { rarity?: string; count: number }[]): Record<string, number> => {
  return array.reduce(
    (acc, card) => {
      acc[card.rarity || ''] = (acc[card.rarity || ''] || 0) + card.count
      return acc
    },
    {} as Record<string, number>,
  )
}

const countWantedByRarity = computed(() => countByRarity(getWantedCardsAsArray.value))
const countGivingByRarity = computed(() => countByRarity(getGivingCardsAsArray.value))

const totalCost = computed(() => {
  return Object.entries(countWantedByRarity.value).reduce((acc, [rarity, count]) => {
    return acc + count * (costByRarity[rarity as keyof typeof costByRarity] || 0)
  }, 0)
})
</script>

<template>
  <div class="prices">
    <h3>To match all your wishes, you <span v-if="!props.showGiving">will</span> need :</h3>
    <div class="price">
      <span>{{ totalCost }}</span>
      <div class="rarity">
        <img src="/images/TRADE_ITEM_130010.webp" alt="Trade Item Token" width="50px" />
      </div>
    </div>
    <div class="price" v-for="(index, rarity) in countWantedByRarity" :key="index">
      <span
        v-if="props.showGiving"
        class="centered"
        :class="countGivingByRarity[rarity] >= countWantedByRarity[rarity] ? 'success' : 'warning'"
      >
        <span>{{ countGivingByRarity[rarity] || 0 }}</span>
        /
        <span>{{ countWantedByRarity[rarity] }}</span>
      </span>
      <span v-else>{{ countWantedByRarity[rarity] }}</span>
      <span>x</span>
      <div class="rarity">
        <RarityImage :rarity="rarity" />
      </div>
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
  width: 200px;
}

.price {
  width: 100%;
  display: grid;
  grid-template-columns: 3fr 1fr 3fr;
  align-items: center;
}

.rarity {
  width: 100px;
  display: flex;
  justify-content: center;
}

.warning {
  color: #d93025;
}

.success {
  color: #188038;
}
</style>
