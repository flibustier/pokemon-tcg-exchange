<script setup lang="ts">
import { rarityLabels } from '@/services/cards'

const numberOfLosangeByRarity = {
  C: 1,
  U: 2,
  R: 3,
  RR: 4,
}

const numberOfStarByRarity = {
  AR: 1,
  SR: 2,
  SAR: 2,
  IM: 3,
}

const numberOfShinyStarByRarity = {
  S: 1,
  SSR: 2,
}

defineProps({
  rarity: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <span :title="rarityLabels[rarity as keyof typeof rarityLabels]" style="display: flex">
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
    <img
      src="/images/rarity/SR.png"
      alt="⭐️🔵"
      width="18px"
      height="18px"
      v-for="i in numberOfShinyStarByRarity[rarity as keyof typeof numberOfShinyStarByRarity]"
      :key="i"
    />
    <img src="/images/rarity/UR.png" alt="👑" height="17px" v-if="rarity === 'UR'" />
  </span>
</template>
