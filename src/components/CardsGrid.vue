<template>
  <div class="container">
    <div class="set" v-for="(set, index) in sets" :key="index">
      <div class="set-logo">
        <a v-if="index > 0" :href="'#' + sets[index - 1].code">
          <img
            :src="`/images/sets/LOGO_expansion_${sets[index - 1].code}_en_US.webp`"
            :alt="sets[index - 1].label.en"
            height="60"
          />
          <img src="/images/double-arrow-left.png" alt="«" height="50" />
        </a>
        <div v-else style="width: 20%"></div>
        <div>
          <img :src="`/images/sets/LOGO_expansion_${set.code}_en_US.webp`" :alt="set.label.en" />
        </div>
        <a v-if="index < sets.length - 1" :href="'#' + sets[index + 1].code">
          <img src="/images/double-arrow-right.png" alt="»" height="50" />
          <img
            :src="`/images/sets/LOGO_expansion_${sets[index + 1].code}_en_US.webp`"
            :alt="sets[index + 1].label.en"
            height="60"
          />
        </a>
        <div v-else style="width: 20%"></div>
      </div>
      <div class="card-grid" :id="set.code">
        <div class="card" v-for="(card, index) in filteredCards(set.code)" :key="index">
          <h3>
            {{ shorten(card.label.eng) }}
            <span class="card-number">{{ card.number.toString().padStart(3, '0') }}</span>
          </h3>
          <img v-if="false" src="/images/wanted.png" alt="wanted" class="corner-icon" />
          <img
            :src="'/images/cards/' + card.imageName"
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import cards from 'pokemon-tcg-pocket-database/dist/cards.json' with { type: 'json' }
import sets from 'pokemon-tcg-pocket-database/dist/sets.json' with { type: 'json' }

import { getGivingCards, getWantedCards, setGivingCards, setWantedCards } from '@/services/store'

import NumberInput from './atoms/NumberInput.vue'

type Card = (typeof cards)[0]

const isRestricted = (card: Card) => {
  return (
    !['C', 'U', 'R', 'RR', 'AR'].includes(card.rarityCode) ||
    !['A1', 'A1A', 'A2'].includes(card.set)
  )
}

const title = (card: Card) => {
  if (isRestricted(card)) {
    return 'Cannot be exchange due to Pokemon TCG Pocket rules'
  } else if (isWantedCard(card)) {
    return 'Already in your want list'
  }
  return card.label.eng
}

const stepCompleted = defineModel<boolean>()

const props = defineProps<{
  step: number
}>()

const filteredCards = (set: string) => cards.filter((card) => card.set === set.toUpperCase())

const shorten = (text: string) => {
  return text.length > 10 ? text.slice(0, 10) + '…' : text
}

const cardCountById = ref<Record<string, number>>({})

watch(
  cardCountById,
  (newStore) => {
    if (props.step === 1) {
      setWantedCards(newStore)
    } else {
      setGivingCards(newStore)
    }
    stepCompleted.value = Object.values(newStore).some((value) => value > 0)
  },
  { deep: true },
)

watch(
  () => props.step,
  () => {
    if (props.step === 1) {
      cardCountById.value = getWantedCards()
    } else {
      cardCountById.value = getGivingCards()
    }
  },
  { immediate: true },
)

const isWantedCard = (card: Card) => {
  if (props.step === 2) {
    const wantedCards = getWantedCards()

    return wantedCards[cardId(card)] > 0
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
  margin-bottom: 2rem;
  max-width: 850px;
}

.set-logo {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  a {
    height: 100%;
  }
}

.card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
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
</style>
