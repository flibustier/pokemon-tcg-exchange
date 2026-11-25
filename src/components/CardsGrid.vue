<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'

import { UNAUTHORIZED_SETS } from '@/../config.json' with { type: 'json' }
import {
  wantedCardsCountById,
  givingCardsCountById,
  isCoveredByJoker,
  JOKER_RARITIES,
  jokerKey,
  jokers,
} from '@/services/store'
import { areJokersLoaded } from '@/services/api'
import { cards, allSets, rarities } from '@/services/cards'
import type { Card } from '@/services/cards'
import { rarityName, searchable, searchableName, setLogo, setName, t } from '@/services/i18n'
import { debounce } from '@/services/utils'

import RichText from './atoms/RichText'
import CardsFilters from './CardsFilters.vue'
import CardsSet from './CardsSet.vue'
import JokerToggles from './molecules/JokerToggles.vue'
import SetSelectorModal from './modals/SetSelectorModal.vue'

const props = defineProps<{
  step: number
  // The offers of a signed-in player: the jokers show once the server sent them
  jokersEnabled?: boolean
}>()

const isWishlist = computed(() => props.step === 1)
const withJokers = computed(
  () => !!props.jokersEnabled && !isWishlist.value && areJokersLoaded.value,
)

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

// Computed once: the cards of each set, whether they can be traded
const cardsBySet: Record<string, Card[]> = Object.fromEntries(sets.map(({ code }) => [code, []]))
const restricted: Record<string, boolean> = {}
for (const card of cards) {
  cardsBySet[card.set]?.push(card)
  restricted[card.id] =
    !rarities[card.rarity as keyof typeof rarities].tradeable ||
    UNAUTHORIZED_SETS.includes(card.set)
}

// The name of each card for the search, once per language
const searchName = computed<Record<string, string>>(() =>
  Object.fromEntries(cards.map((card) => [card.id, searchableName(card)])),
)

const cardCountById = computed(() =>
  isWishlist.value ? wantedCardsCountById.value : givingCardsCountById.value,
)

// Going through every card takes a few dozen milliseconds on a phone: the search waits for a
// pause in typing, so the letters show up as they are typed.
const searchedName = ref<string>()
watch(
  () => filters.value.cardName,
  debounce(() => (searchedName.value = searchable(filters.value.cardName ?? '')), 150),
)

const isSameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((id) => b.has(id))

// Ids of the cards the filters let through, by set. Counts are only read when a filter
// needs them, so changing a count does not recompute this. A set whose result did not
// change keeps the same object, so it is not rendered again.
const visibleIds = computed<Record<string, Set<string>>>((previous) => {
  const { hideEmpty, hideUnavailable, raritySelection } = filters.value
  const name = searchedName.value
  // Read only when searching, so that the grid costs nothing more otherwise
  const names = name ? searchName.value : {}
  const result: Record<string, Set<string>> = {}
  for (const { code } of sets) {
    const ids = new Set(
      cardsBySet[code]
        .filter(
          (card) =>
            (!name || names[card.id].includes(name)) &&
            (!hideEmpty ||
              cardCountById.value[card.id] > 0 ||
              (withJokers.value && !restricted[card.id] && isCoveredByJoker(card))) &&
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

// The shortcut for every set: a rarity is on when its joker is on in every set that has it
const setsWithRarity = Object.fromEntries(
  JOKER_RARITIES.map((rarity) => [
    rarity,
    sets
      .filter(({ code }) =>
        cardsBySet[code].some((card) => card.rarity === rarity && !restricted[card.id]),
      )
      .map(({ code }) => code),
  ]),
)

const allSetsToggles = computed(() =>
  JOKER_RARITIES.filter((rarity) => setsWithRarity[rarity].length > 0).map((rarity) => {
    const params = { rarity: rarityName(rarity) }
    const on = setsWithRarity[rarity].filter((code) => jokers.value[jokerKey(code, rarity)])
    const state =
      on.length === setsWithRarity[rarity].length
        ? ('on' as const)
        : on.length > 0
          ? ('some' as const)
          : ('off' as const)
    return {
      rarity,
      state,
      title: state === 'on' ? t('jokers.allSetsOn', params) : t('jokers.allSetsOff', params),
    }
  }),
)

const toggleAllSets = (rarity: string) => {
  const everywhere = allSetsToggles.value.find((toggle) => toggle.rarity === rarity)?.state === 'on'
  for (const code of setsWithRarity[rarity]) {
    if (everywhere) delete jokers.value[jokerKey(code, rarity)]
    else jokers.value[jokerKey(code, rarity)] = true
  }
}

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
    <!-- Above the header, so it reads as the setting of no set in particular -->
    <JokerToggles
      v-if="withJokers"
      class="all-sets-jokers"
      :label="t('jokers.allSets')"
      :toggles="allSetsToggles"
      @toggle="toggleAllSets"
    />
    <div class="set-header" ref="header">
      <div class="set-logo" v-if="currentSet">
        <a v-if="previousSet" :href="'#' + previousSet.code">
          <img
            :src="setLogo(previousSet)"
            :alt="setName(previousSet)"
            width="136"
            height="60"
            class="hidden-sm"
          />
          <img src="/images/double-arrow-left.png" alt="«" width="47" height="50" />
        </a>
        <div v-else class="bumper"></div>

        <img
          :src="setLogo(currentSet)"
          :alt="setName(currentSet)"
          class="set-current-logo"
          width="192"
          height="85"
          fetchpriority="high"
          @click="isSetSelectorModalVisible = true"
          :title="t('sets.selectTitle')"
        />

        <a v-if="nextSet" :href="'#' + nextSet.code">
          <img src="/images/double-arrow-right.png" alt="»" width="47" height="50" />
          <img
            :src="setLogo(nextSet)"
            :alt="setName(nextSet)"
            width="136"
            height="60"
            class="hidden-sm"
          />
        </a>
        <div v-else class="bumper"></div>
      </div>
      <CardsFilters v-model="filters" :cards />
    </div>
    <!-- With jokers, every set shows its divider: the first one too, even without jokers, so
         that each set reads as its own -->
    <CardsSet
      v-for="(set, index) in sets"
      :key="set.code"
      :class="{ 'is-first': set.code === firstVisibleCode && !withJokers }"
      :set
      :cards="cardsBySet[set.code]"
      :visible-ids="visibleIds[set.code]"
      :restricted
      :is-wishlist="isWishlist"
      :with-jokers="withJokers"
      :eager-count="index === 0 ? 5 : 0"
    />
    <p v-if="hasNoResults" class="no-results"><RichText text="sets.noResults" /></p>
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
  background: var(--color-background-glass);
  background-image: linear-gradient(
    to top,
    var(--color-background-transparent),
    var(--color-background)
  );
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

.all-sets-jokers {
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: var(--color-surface-soft);
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
