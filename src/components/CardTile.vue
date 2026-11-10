<script setup lang="ts">
import { computed } from 'vue'

import { wantedCardsCountById, givingCardsCountById } from '@/services/store'
import type { Card } from '@/services/cards'

import NumberInput from './atoms/NumberInput.vue'

// Each card reads its own count, so changing one count re-renders this card only, not the grid.
const props = defineProps<{
  card: Card
  restricted: boolean
  isWishlist: boolean
  eager: boolean
}>()

const counts = computed(() =>
  props.isWishlist ? wantedCardsCountById.value : givingCardsCountById.value,
)

// A card already in the want list cannot be offered
const isWanted = computed(() => !props.isWishlist && wantedCardsCountById.value[props.card.id] > 0)

const title = computed(() => {
  if (props.restricted) {
    return 'Cannot be exchange due to Pokemon TCG Pocket rules'
  } else if (isWanted.value) {
    return 'Already in your want list'
  }
  return props.card.name
})

const increase = () => {
  if (!isWanted.value && !props.restricted) {
    counts.value[props.card.id] = (counts.value[props.card.id] || 0) + 1
  }
}
</script>

<template>
  <div class="card">
    <h3 :title="card.name">
      <span class="card-label hidden-sm">{{ card.name }}</span>
      <span class="card-number">{{ card.number.toString().padStart(3, '0') }}</span>
    </h3>
    <img
      :src="card.imagePaths.thumbnail"
      :alt="card.name"
      class="card-image"
      width="200"
      height="280"
      :class="{ disabled: isWanted || restricted }"
      @click="increase"
      :loading="eager ? 'eager' : 'lazy'"
      :title="title"
    />
    <span v-if="restricted" class="card-decoration" :title="title">🚫</span>
    <NumberInput v-else-if="!isWanted" v-model="counts[card.id]" />
  </div>
</template>

<style scoped>
.card {
  width: 20%;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  align-self: stretch;
  img {
    width: 100%;
    height: auto;
  }

  /* The browser skips the rendering of off-screen cards. Until a card has been rendered once,
     its height is estimated from its width (20% of the grid, a container): the image is about
     1.4 times as tall as it is wide, plus the name and the counter. */
  content-visibility: auto;
  contain-intrinsic-block-size: auto calc(28.1cqw + 48px);
}

h3 {
  max-width: 100%;
  display: flex;
}

.card-label {
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
  white-space: nowrap;
  margin-right: 0.5rem;
}

.card-number {
  font-size: 1.2rem;
}

.card-image {
  cursor: pointer;
}

.card-image.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.card-decoration {
  position: relative;
  bottom: 55%;
  height: 0;
  font-size: 32px;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .hidden-sm {
    display: none;
  }

  .card {
    padding: 2px;
    contain-intrinsic-block-size: auto calc(28.1cqw + 96px);
  }
}
</style>
