<script setup lang="ts">
import type { Card } from '@/services/cards'

import CardTile from './CardTile.vue'

// One set: its divider and its cards. Cards the filters exclude stay mounted, hidden:
// mounting thousands of cards again on each keystroke is what made typing slow.
defineProps<{
  set: { code: string; imagePath: string; name: { en: string } }
  cards: Card[]
  visibleIds: Set<string>
  restricted: Record<string, boolean>
  isWishlist: boolean
  eagerCount: number
}>()
</script>

<template>
  <section v-show="visibleIds.size > 0" class="set" :id="set.code">
    <div class="set-divider">
      <img
        :src="set.imagePath"
        :alt="set.name.en"
        :title="set.name.en"
        width="192"
        height="85"
        loading="lazy"
      />
    </div>
    <div class="card-grid">
      <CardTile
        v-for="(card, cardIndex) in cards"
        v-show="visibleIds.has(card.id)"
        :key="card.id"
        :card
        :restricted="restricted[card.id]"
        :is-wishlist="isWishlist"
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
    border-top: 2px solid #e4e4e4;
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
