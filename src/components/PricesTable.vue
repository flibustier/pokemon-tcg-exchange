<script setup lang="ts">
import { computed } from 'vue'

import { getGivingCardsAsArray, getWantedCardsAsArray } from '@/services/store'

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

const numberOfLosangeByRarity = {
  C: 1,
  U: 2,
  R: 3,
  RR: 4,
}

const numberOfStarByRarity = {
  AR: 1,
  SR: 2,
  IM: 3,
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
        <img
          src="/images/rarity/Losange.png"
          alt="🔹"
          width="15px"
          v-for="i in numberOfLosangeByRarity[rarity as keyof typeof numberOfLosangeByRarity]"
          :key="i"
        />
        <img
          src="/images/rarity/Star.png"
          alt="⭐️"
          width="20px"
          v-for="i in numberOfStarByRarity[rarity as keyof typeof numberOfStarByRarity]"
          :key="i"
        />
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

.warning {
  color: #d93025;
}

.success {
  color: #188038;
}
</style>
