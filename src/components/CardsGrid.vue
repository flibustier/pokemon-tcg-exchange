<script setup lang="ts">
import { computed, reactive } from 'vue'

import { AUTHORIZED_RARITIES, AUTHORIZED_SETS } from '@/../config.json' with { type: 'json' }
import { wantedCardsCountById, givingCardsCountById } from '@/services/store'
import { cards, allSets } from '@/services/cards'
import type { Card } from '@/services/cards'

import NumberInput from './atoms/NumberInput.vue'
import CardsFilters from './CardsFilters.vue'

const filters = reactive({
  hideUnavailable: false,
  hideEmpty: false,
  raritySelection: [] as string[],
})

const isRestricted = (card: Card) => {
  return !AUTHORIZED_RARITIES.includes(card.rarityCode) || !AUTHORIZED_SETS.includes(card.set)
}

const title = (card: Card) => {
  if (isRestricted(card)) {
    return 'Cannot be exchange due to Pokemon TCG Pocket rules'
  } else if (isWantedCard(card)) {
    return 'Already in your want list'
  }
  return card.label.eng
}

const props = defineProps<{
  step: number
}>()

const sets = computed(() => allSets) //.filter((set) => set.code !== 'PROMO-A'))

const filteredCards = (set?: string) =>
  cards.filter(
    (card) =>
      (!set || card.set === set.toUpperCase()) &&
      (!filters.hideEmpty || cardCountById.value[cardId(card)] > 0) &&
      (!filters.hideUnavailable ||
        (!isRestricted(card) && (!isWantedCard(card) || props.step === 1))) &&
      (filters.raritySelection.length === 0 || filters.raritySelection.includes(card.rarityCode)),
  )

const shorten = (text: string) => {
  return text.length > 10 ? text.slice(0, 10) + '…' : text
}

const cardCountById = computed(() => {
  if (props.step === 1) {
    return wantedCardsCountById.value
  } else {
    return givingCardsCountById.value
  }
})

const isWantedCard = (card: Card) => {
  if (props.step === 2) {
    return wantedCardsCountById.value[cardId(card)] > 0
  }

  return false
}

const cardId = (card: Card) => `${card.set}-${card.number}`

const increase = (card: Card) => {
  if (!isWantedCard(card) && !isRestricted(card)) {
    cardCountById.value[cardId(card)] = (cardCountById.value[cardId(card)] || 0) + 1
  }
}
</script>

<template>
  <div class="container">
    <div class="set" v-for="(set, index) in sets" :key="index">
      <div class="set-header" v-if="filteredCards(set.code).length > 0">
        <div class="set-logo">
          <a v-if="index > 0" :href="'#' + sets[index - 1].code">
            <img
              :src="`/images/sets/LOGO_expansion_${sets[index - 1].code}_en_US.webp`"
              :alt="sets[index - 1].label.en"
              height="60"
              class="hidden-sm"
            />
            <img src="/images/double-arrow-left.png" alt="«" height="50" />
          </a>
          <div v-else class="bumper"></div>
          <div>
            <img :src="`/images/sets/LOGO_expansion_${set.code}_en_US.webp`" :alt="set.label.en" />
          </div>
          <a v-if="index < sets.length - 1" :href="'#' + sets[index + 1].code">
            <img src="/images/double-arrow-right.png" alt="»" height="50" />
            <img
              :src="`/images/sets/LOGO_expansion_${sets[index + 1].code}_en_US.webp`"
              :alt="sets[index + 1].label.en"
              height="60"
              class="hidden-sm"
            />
          </a>
          <div v-else class="bumper"></div>
        </div>
        <CardsFilters v-model="filters" :cards="cards" />
      </div>
      <div class="card-grid" :id="set.code">
        <div class="card" v-for="(card, index) in filteredCards(set.code)" :key="index">
          <h3>
            {{ shorten(card.label.eng) }}
            <span class="card-number">{{ card.number.toString().padStart(3, '0') }}</span>
          </h3>
          <img v-if="false" src="/images/wanted.png" alt="wanted" class="corner-icon" />
          <img
            :src="'/images/cards/thumbnails/' + card.imageName"
            :alt="card.label.slug"
            class="card-image"
            :class="{ disabled: isWantedCard(card) || isRestricted(card) }"
            @click="increase(card)"
            loading="lazy"
            :title="title(card)"
          />
          <span v-if="isRestricted(card)" class="card-decoration" :title="title(card)">🚫</span>
          <NumberInput v-else-if="!isWantedCard(card)" v-model="cardCountById[cardId(card)]" />
        </div>
      </div>
    </div>
    <template v-if="filteredCards().length === 0">
      <CardsFilters v-model="filters" :cards="cards" />
      <p class="no-results">No results :/<br />Please adjust your filters</p>
    </template>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.set {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.set-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  background: #fffd;
  background-image: linear-gradient(to top, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
}

.set-logo {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  a {
    height: 100%;
  }
}

.bumper {
  width: 20%;
}

.card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
}

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
  }
}

.card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

h3 {
  font-weight: medium;
}

.no-results {
  text-align: center;
  font-size: 1.5rem;
  margin-top: 2rem;
}

.card-number {
  margin-left: 1rem;
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

.corner-icon {
  position: relative;
  width: 10px;
}

@media (max-width: 700px) {
  .hidden-sm {
    display: none;
  }

  .bumper {
    width: 9%;
  }
}
</style>
