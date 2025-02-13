<template>
  <div class="container">
    <div class="set" v-for="(set, index) in sets" :key="index">
      <img
        :src="`/images/sets/LOGO_expansion_${set.set}_en_US.webp`"
        :alt="set.label.en"
        class="set-logo"
      />
      <div class="card-grid">
        <div class="card" v-for="(card, index) in filteredCards(set.set)" :key="index">
          <h3>
            {{ card.label.eng }}
            <span class="card-number">{{ card.number.padStart(3, '0') }}</span>
          </h3>
          <img v-if="false" src="/images/wanted.png" alt="wanted" class="corner-icon" />
          <img
            :src="'images/cards/' + card.imageName"
            :alt="card.label.slug"
            class="card-image"
            :class="{ disabled: isWantedCard(card) }"
            @click="increase(card)"
            loading="lazy"
          />
          <NumberInput v-if="!isWantedCard(card)" v-model="cardCountById[cardId(card)]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import cards from 'pokemon-tcg-pocket-database/dist/cards.json' with { type: 'json' }
import NumberInput from './atoms/NumberInput.vue'
import { getGivingCards, getWantedCards, setGivingCards, setWantedCards } from '@/services/store'

type Card = (typeof cards)[0]

const sets = [
  {
    set: 'A1',
    releaseDate: '2024-10-30',
    count: 226,
    label: {
      en: 'Genetic Apex',
    },
  },
  {
    set: 'A1a',
    releaseDate: '2024-12-17',
    count: 68,
    label: {
      en: 'Mythical Island',
    },
  },
  {
    set: 'A2',
    releaseDate: '2025-01-29',
    count: 155,
    label: {
      en: 'Space-Time Smackdown',
    },
  },
  {
    set: 'PROMO-A',
    releaseDate: '2024-10-30',
    label: {
      en: 'Promo A',
    },
  },
]

const stepCompleted = defineModel<boolean>()

const props = defineProps<{
  step: number
}>()

const filteredCards = (set: string) => cards.filter((card) => card.set === set.toUpperCase())

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
  if (!isWantedCard(card)) {
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

.corner-icon {
  position: relative;
  width: 10px;
}
</style>
