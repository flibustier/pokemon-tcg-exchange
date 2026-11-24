<script setup lang="ts">
import { computed } from 'vue'

import type { Card } from '@/services/cards'
import { rarityName, setName, t, type SetNames } from '@/services/i18n'
import { JOKER_RARITIES, jokerKey, jokers } from '@/services/store'

import CardTile from './CardTile.vue'
import JokerToggles from './molecules/JokerToggles.vue'

// One set: its divider and its cards. Cards the filters exclude stay mounted, hidden:
// mounting thousands of cards again on each keystroke is what made typing slow.
const props = defineProps<{
  set: { code: string; imagePath: string; name: SetNames }
  cards: Card[]
  visibleIds: Set<string>
  restricted: Record<string, boolean>
  isWishlist: boolean
  eagerCount: number
  // On the offers of a signed-in player: the divider holds the set's jokers
  withJokers: boolean
}>()

// The rarities a joker can cover that this set has, among the cards that can be traded
const jokerRarities = computed(() =>
  props.withJokers
    ? JOKER_RARITIES.filter((rarity) =>
        props.cards.some((card) => card.rarity === rarity && !props.restricted[card.id]),
      )
    : [],
)

const jokerToggles = computed(() =>
  jokerRarities.value.map((rarity) => {
    const on = jokers.value[jokerKey(props.set.code, rarity)] === true
    const params = { rarity: rarityName(rarity), set: setName(props.set) }
    return {
      rarity,
      state: on ? ('on' as const) : ('off' as const),
      title: on ? t('jokers.setOn', params) : t('jokers.setOff', params),
    }
  }),
)

const toggleJoker = (rarity: string) => {
  const key = jokerKey(props.set.code, rarity)
  if (jokers.value[key]) delete jokers.value[key]
  else jokers.value[key] = true
}
</script>

<template>
  <section v-show="visibleIds.size > 0" class="set" :id="set.code">
    <div class="set-divider">
      <img
        :src="set.imagePath"
        :alt="setName(set)"
        :title="setName(set)"
        width="192"
        height="85"
        loading="lazy"
      />
    </div>
    <JokerToggles
      v-if="jokerToggles.length > 0"
      class="set-jokers"
      :label="t('jokers.set')"
      :hint="t('jokers.setHint')"
      :toggles="jokerToggles"
      @toggle="toggleJoker"
    />
    <div class="card-grid">
      <CardTile
        v-for="(card, cardIndex) in cards"
        v-show="visibleIds.has(card.id)"
        :key="card.id"
        :card
        :restricted="restricted[card.id]"
        :is-wishlist="isWishlist"
        :with-jokers="withJokers"
        :eager="cardIndex < eagerCount"
      />
    </div>
  </section>
</template>

<style scoped>
.set {
  scroll-margin-top: var(--header-height);
  width: 100%;
}

/* Between two sets: a line, the set's logo, a line */
.set-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  margin: 1.5rem 0 1rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 2px solid var(--color-border);
  }

  img {
    height: 56px;
    width: auto;
  }
}

/* The sticky header already shows the first set's logo */
.set.is-first .set-divider {
  display: none;
}

.set-jokers {
  margin-bottom: 1rem;
}

.card-grid {
  /* Lets the cards estimate their height from the grid width, see CardTile */
  container-type: inline-size;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
