<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

import { UNAUTHORIZED_SETS } from '@/../config.json' with { type: 'json' }
import { wantedCardsCountById, givingCardsCountById } from '@/services/store'
import { cards, allSets, rarities } from '@/services/cards'
import type { Card } from '@/services/cards'

import NumberInput from './atoms/NumberInput.vue'
import CardsFilters from './CardsFilters.vue'
import SetSelectorModal from './modals/SetSelectorModal.vue'

const isSetSelectorModalVisible = ref(false)

const filters = ref({
  hideUnavailable: false,
  hideEmpty: false,
  raritySelection: [] as string[],
  cardName: undefined as string | undefined,
})

const isRestricted = (card: Card) => {
  return (
    !rarities[card.rarity as keyof typeof rarities].tradeable ||
    UNAUTHORIZED_SETS.includes(card.set)
  )
}

const title = (card: Card) => {
  if (isRestricted(card)) {
    return 'Cannot be exchange due to Pokemon TCG Pocket rules'
  } else if (isWantedCard(card)) {
    return 'Already in your want list'
  }
  return card.name
}

const props = defineProps<{
  step: number
}>()

const isWishlist = computed(() => props.step === 1)

const sets = computed(() =>
  allSets
    .filter(({ code }) => !code.startsWith('PROMO'))
    .sort((a, b) => (a.code < b.code ? 1 : -1)),
)

const filteredCardsBySet = computed(() => {
  const result: Record<string, Card[]> = {}
  for (const set of sets.value) {
    result[set.code] = cards.filter(
      (card) =>
        card.set === set.code.toUpperCase() &&
        (!filters.value.cardName ||
          card.name.toLowerCase().includes(filters.value.cardName.toLowerCase())) &&
        (!filters.value.hideEmpty || cardCountById.value[cardId(card)] > 0) &&
        (!filters.value.hideUnavailable ||
          (!isRestricted(card) && (!isWantedCard(card) || props.step === 1))) &&
        (filters.value.raritySelection.length === 0 ||
          filters.value.raritySelection.includes(card.rarity)),
    )
  }
  return result
})

const cardCountById = computed(() => {
  if (isWishlist.value) {
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

const header = useTemplateRef('header')
const headerHeight = ref(0)
const currentSetIndex = ref(0)
const currentSet = computed(() => sets.value[currentSetIndex.value])

// The current set is the last one (with visible cards) whose grid starts above the header bottom
const updateCurrentSet = () => {
  const headerBottom = header.value?.getBoundingClientRect().bottom ?? 0
  let index = -1
  sets.value.forEach(({ code }, i) => {
    if (filteredCardsBySet.value[code].length === 0) return
    const top = document.getElementById(code)?.getBoundingClientRect().top ?? Infinity
    if (index === -1 || top <= headerBottom + 1) index = i
  })
  if (index !== -1) currentSetIndex.value = index
}

watch(filteredCardsBySet, () => nextTick(updateCurrentSet))

const resizeObserver =
  typeof ResizeObserver === 'undefined'
    ? undefined
    : new ResizeObserver(([entry]) => {
        headerHeight.value = entry.borderBoxSize[0].blockSize
      })

onMounted(() => {
  if (header.value) resizeObserver?.observe(header.value)
  window.addEventListener('scroll', updateCurrentSet, { passive: true })
  window.addEventListener('resize', updateCurrentSet)
  updateCurrentSet()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', updateCurrentSet)
  window.removeEventListener('resize', updateCurrentSet)
})
</script>

<template>
  <div class="container" :style="{ '--header-height': `${headerHeight}px` }">
    <SetSelectorModal v-model="isSetSelectorModalVisible" :sets="sets" />
    <div class="set-header" ref="header">
      <div class="set-logo" v-if="currentSet">
        <a v-if="currentSetIndex > 0" :href="'#' + sets[currentSetIndex - 1].code">
          <img
            :src="sets[currentSetIndex - 1].imagePath"
            :alt="sets[currentSetIndex - 1].name.en"
            width="136"
            height="60"
            class="hidden-sm"
          />
          <img src="/images/double-arrow-left.png" alt="«" width="47" height="50" />
        </a>
        <div v-else class="bumper"></div>

        <img
          :src="currentSet.imagePath"
          :alt="currentSet.name.en"
          class="set-current-logo"
          width="192"
          height="85"
          fetchpriority="high"
          @click="isSetSelectorModalVisible = true"
          title="Click to select another set"
        />

        <a v-if="currentSetIndex < sets.length - 1" :href="'#' + sets[currentSetIndex + 1].code">
          <img src="/images/double-arrow-right.png" alt="»" width="47" height="50" />
          <img
            :src="sets[currentSetIndex + 1].imagePath"
            :alt="sets[currentSetIndex + 1].name.en"
            width="136"
            height="60"
            class="hidden-sm"
          />
        </a>
        <div v-else class="bumper"></div>
      </div>
      <CardsFilters v-model="filters" :cards />
    </div>
    <div class="card-grid" v-for="(set, index) in sets" :key="set.code" :id="set.code">
      <div class="card" v-for="(card, cardIndex) in filteredCardsBySet[set.code]" :key="cardIndex">
        <h3 :title="card.name">
          <span class="card-label hidden-sm">{{ card.name }}</span>
          <span class="card-number">{{ card.number.toString().padStart(3, '0') }}</span>
        </h3>
        <img v-if="false" src="/images/wanted.png" alt="wanted" class="corner-icon" />
        <img
          :src="card.imagePaths.thumbnail"
          :alt="card.name"
          class="card-image"
          width="200"
          height="280"
          :class="{ disabled: isWantedCard(card) || isRestricted(card) }"
          @click="increase(card)"
          :loading="index === 0 && cardIndex < 5 ? 'eager' : 'lazy'"
          :title="title(card)"
        />
        <span v-if="isRestricted(card)" class="card-decoration" :title="title(card)">🚫</span>
        <NumberInput v-else-if="!isWantedCard(card)" v-model="cardCountById[cardId(card)]" />
      </div>
    </div>
    <p v-if="Object.values(filteredCardsBySet).flat().length === 0" class="no-results">
      No results :/<br />Please adjust your filters
    </p>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
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
    align-items: center;
    display: flex;
  }
}

.bumper {
  width: 20%;
}

.set-current-logo {
  cursor: pointer;
  transition: transform 0.2s;
}

.set-current-logo:hover {
  transform: scale(1.05);
}

.card-grid {
  scroll-margin-top: var(--header-height);
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
    height: auto;
  }
}

.no-results {
  text-align: center;
  font-size: 1.5rem;
  margin-top: 2rem;
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

  .set-current-logo {
    height: 83px;
    width: auto;
  }

  .card {
    padding: 2px;
  }
}
</style>
