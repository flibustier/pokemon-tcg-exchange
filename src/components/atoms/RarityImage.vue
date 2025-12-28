<script setup lang="ts">
import { computed } from 'vue'
import { rarities } from '@/services/cards'

import diamond from 'pokemon-tcg-pocket-database/dist/images/rarities/diamond.webp'
import star from 'pokemon-tcg-pocket-database/dist/images/rarities/star.webp'
import shiny from 'pokemon-tcg-pocket-database/dist/images/rarities/shiny-star.webp'
import crown from 'pokemon-tcg-pocket-database/dist/images/rarities/crown.webp'

const images = {
  diamond,
  star,
  shiny,
  crown,
}

const props = defineProps({
  rarity: {
    type: String,
    required: true,
  },
})

const rarity = computed(() => rarities[props.rarity as keyof typeof rarities])

const imgProps = computed(() => {
  let height, width
  if (rarity.value.group === 'Diamond') {
    width = 15
  } else if (rarity.value.group === 'Star') {
    width = 20
  } else if (rarity.value.group === 'Shiny') {
    width = 18
    height = 18
  } else if (rarity.value.group === 'Crown') {
    height = 17
  }

  return {
    src: images[rarity.value.group.toLowerCase() as keyof typeof images],
    alt: rarity.value.label || '',
    width,
    height,
  }
})
</script>

<template>
  <span :title="rarity.label || ''" style="display: flex">
    <img v-bind="imgProps" v-for="i in rarity.count" :key="i" />
  </span>
</template>
