<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

import { UNAUTHORIZED_SETS } from '@/../config.json' with { type: 'json' }
import { wantedCardsCountById, givingCardsCountById } from '@/services/store'
import { cards, allSets, rarities } from '@/services/cards'
import type { Card } from '@/services/cards'
import { debounce } from '@/services/utils'

import CardsFilters from './CardsFilters.vue'
import CardsSet from './CardsSet.vue'
import SetSelectorModal from './modals/SetSelectorModal.vue'

const props = defineProps<{
  step: number
}>()

const isWishlist = computed(() => props.step === 1)

const isSetSelectorModalVisible = ref(false)

const filters = ref({
  hideUnavailable: false,
  hideEmpty: false,
  raritySelection: [] as string[],
  cardName: undefined as string | undefined,
})

const sets = allSets
  .filter(({ code }) => !code.startsWith('PROMO'))
  .sort((a, b) => (a.code < b.code ? 1 : -1))

// Computed once: the cards of each set, whether they can be traded, their name for the search
const cardsBySet: Record<string, Card[]> = Object.fromEntries(sets.map(({ code }) => [code, []]))
const restricted: Record<string, boolean> = {}
const searchName: Record<string, string> = {}
for (const card of cards) {
  cardsBySet[card.set]?.push(card)
  restricted[card.id] =
    !rarities[card.rarity as keyof typeof rarities].tradeable ||
    UNAUTHORIZED_SETS.includes(card.set)
  searchName[card.id] = card.name.toLowerCase()
}

const cardCountById = computed(() =>
  isWishlist.value ? wantedCardsCountById.value : givingCardsCountById.value,
)

// Going through every card takes a few dozen milliseconds on a phone: the search waits for a
// pause in typing, so the letters show up as they are typed.
const searchedName = ref<string>()
watch(
  () => filters.value.cardName,
  debounce(() => (searchedName.value = filters.value.cardName?.toLowerCase()), 150),
)

const isSameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((id) => b.has(id))

// Ids of the cards the filters let through, by set. Counts are only read when a filter
// needs them, so changing a count does not recompute this. A set whose result did not
// change keeps the same object, so it is not rendered again.
const visibleIds = computed<Record<string, Set<string>>>((previous) => {
  const { hideEmpty, hideUnavailable, raritySelection } = filters.value
  const name = searchedName.value
  const result: Record<string, Set<string>> = {}
  for (const { code } of sets) {
    const ids = new Set(
      cardsBySet[code]
        .filter(
          (card) =>
            (!name || searchName[card.id].includes(name)) &&
            (!hideEmpty || cardCountById.value[card.id] > 0) &&
            (!hideUnavailable ||
              (!restricted[card.id] &&
                (isWishlist.value || !(wantedCardsCountById.value[card.id] > 0)))) &&
            (raritySelection.length === 0 || raritySelection.includes(card.rarity)),
        )
        .map(({ id }) => id),
    )
    const before = previous?.[code]
    result[code] = before && isSameSet(before, ids) ? before : ids
  }
  return result
})

const hasVisibleCards = (code: string) => visibleIds.value[code].size > 0
const firstVisibleCode = computed(() => sets.find(({ code }) => hasVisibleCards(code))?.code)
const hasNoResults = computed(() => firstVisibleCode.value === undefined)

const header = useTemplateRef('header')
const headerHeight = ref(0)
const currentSetIndex = ref(0)
const currentSet = computed(() => sets[currentSetIndex.value])

// The « » arrows skip the sets the filters emptied
const visibleSetIndexes = computed(() =>
  sets.flatMap(({ code }, i) => (hasVisibleCards(code) ? [i] : [])),
)
const neighbourSet = (offset: number) => {
  const position = visibleSetIndexes.value.indexOf(currentSetIndex.value)
  if (position === -1) return undefined
  const index = visibleSetIndexes.value[position + offset]
  return index === undefined ? undefined : sets[index]
}
const previousSet = computed(() => neighbourSet(-1))
const nextSet = computed(() => neighbourSet(1))

// The current set is the last one (with visible cards) whose grid starts above the header bottom
const updateCurrentSet = () => {
  const headerBottom = header.value?.getBoundingClientRect().bottom ?? 0
  let index = -1
  sets.forEach(({ code }, i) => {
    if (!hasVisibleCards(code)) return
    const top = document.getElementById(code)?.getBoundingClientRect().top ?? Infinity
    if (index === -1 || top <= headerBottom + 1) index = i
  })
  if (index !== -1) currentSetIndex.value = index
}

watch(visibleIds, () => nextTick(updateCurrentSet))

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
        <a v-if="previousSet" :href="'#' + previousSet.code">
          <img
            :src="previousSet.imagePath"
            :alt="previousSet.name.en"
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

        <a v-if="nextSet" :href="'#' + nextSet.code">
          <img src="/images/double-arrow-right.png" alt="»" width="47" height="50" />
          <img
            :src="nextSet.imagePath"
            :alt="nextSet.name.en"
            width="136"
            height="60"
            class="hidden-sm"
          />
        </a>
        <div v-else class="bumper"></div>
      </div>
      <CardsFilters v-model="filters" :cards />
    </div>
    <CardsSet
      v-for="(set, index) in sets"
      :key="set.code"
      :class="{ 'is-first': set.code === firstVisibleCode }"
      :set
      :cards="cardsBySet[set.code]"
      :visible-ids="visibleIds[set.code]"
      :restricted
      :is-wishlist="isWishlist"
      :eager-count="index === 0 ? 5 : 0"
    />
    <p v-if="hasNoResults" class="no-results">No results :/<br />Please adjust your filters</p>
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

.no-results {
  text-align: center;
  font-size: 1.5rem;
  margin-top: 2rem;
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
}
</style>
