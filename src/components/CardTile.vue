<script setup lang="ts">
import { computed } from 'vue'

import {
  wantedCardsCountById,
  givingCardsCountById,
  isCoveredByJoker,
  jokerExclusions,
  jokerKey,
  jokers,
} from '@/services/store'
import { cardName, t } from '@/services/i18n'
import type { Card } from '@/services/cards'

import NumberInput from './atoms/NumberInput.vue'

// Each card reads its own count, so changing one count re-renders this card only, not the grid.
const props = defineProps<{
  card: Card
  restricted: boolean
  isWishlist: boolean
  withJokers?: boolean
  eager: boolean
}>()

const counts = computed(() =>
  props.isWishlist ? wantedCardsCountById.value : givingCardsCountById.value,
)

// A card already in the want list cannot be offered
const isWanted = computed(() => !props.isWishlist && wantedCardsCountById.value[props.card.id] > 0)

// A joker covers this card's set and rarity: the card is given by it, unless the player wants
// it, lists it with a count, or left it out
const hasJoker = computed(
  () =>
    props.withJokers &&
    !props.restricted &&
    jokers.value[jokerKey(props.card.set, props.card.rarity)] === true,
)
const isCovered = computed(() => hasJoker.value && isCoveredByJoker(props.card))
const isLeftOut = computed(
  () =>
    hasJoker.value &&
    jokerExclusions.value[props.card.id] === true &&
    !isWanted.value &&
    !(givingCardsCountById.value[props.card.id] > 0),
)

const name = computed(() => cardName(props.card))

const title = computed(() => {
  if (props.restricted) {
    return t('card.restricted')
  } else if (isWanted.value) {
    return t('card.wanted')
  } else if (isCovered.value) {
    return t('card.givenByJoker', { name: name.value })
  } else if (isLeftOut.value) {
    return t('card.leftOutOfJoker', { name: name.value })
  }
  return name.value
})

const increase = () => {
  if (!isWanted.value && !props.restricted) {
    counts.value[props.card.id] = (counts.value[props.card.id] || 0) + 1
  }
}

const select = () => {
  if (isCovered.value) {
    jokerExclusions.value[props.card.id] = true
  } else if (isLeftOut.value) {
    delete jokerExclusions.value[props.card.id]
  } else {
    increase()
  }
}
</script>

<template>
  <div class="card">
    <h3 :title="name">
      <span class="card-label hidden-sm">{{ name }}</span>
      <span class="card-number">{{ card.number.toString().padStart(3, '0') }}</span>
    </h3>
    <img
      :src="card.imagePaths.thumbnail"
      :alt="name"
      class="card-image"
      width="200"
      height="280"
      :class="{ disabled: isWanted || restricted, 'in-joker': isCovered }"
      @click="select"
      :loading="eager ? 'eager' : 'lazy'"
      :title="title"
    />
    <span v-if="restricted" class="card-decoration" :title="title">🚫</span>
    <button
      v-else-if="isCovered || isLeftOut"
      type="button"
      class="joker-badge"
      :class="{ 'is-left-out': isLeftOut }"
      :title="title"
      @click="select"
    >
      {{ isCovered ? t('card.joker') : t('card.leftOut') }}
    </button>
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

/* Given by a joker: nothing to count, the card fades behind its badge */
.card-image.in-joker {
  opacity: 0.55;
}

.joker-badge {
  height: 24px;
  padding: 0 0.6rem;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--active-color);
  color: var(--color-text);
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.joker-badge.is-left-out {
  background: transparent;
  border: 1px dashed var(--color-border-strong);
  color: var(--color-text-muted);
}

.joker-badge:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
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
