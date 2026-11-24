<script setup lang="ts">
import { computed } from 'vue'

import { t } from '@/services/i18n'
import { getWantedCardsAsArray } from '@/services/store'

const countByPack = (array: { packs?: string[]; count: number }[]): Record<string, number> => {
  return array.reduce(
    (acc, card) => {
      for (const pack of card.packs || []) {
        acc[pack || ''] = (acc[pack || ''] || 0) + card.count
      }
      return acc
    },
    {} as Record<string, number>,
  )
}

const countWantedByPack = computed(() =>
  Object.entries(countByPack(getWantedCardsAsArray.value)).sort((a, b) => b[1] - a[1]),
)
</script>

<template>
  <div class="prices" v-if="getWantedCardsAsArray.length > 0">
    <h3>{{ t('packs.title') }}</h3>

    <div class="price" v-for="[pack, count] of countWantedByPack" :key="pack">
      <div class="rarity">
        <img
          :src="`/images/packs/${pack}.webp`"
          :alt="pack"
          height="100px"
          :title="t('packs.name', { pack })"
        />
      </div>
      <span>{{ t('packs.wanted', { n: count }) }}</span>
    </div>
  </div>
</template>

<style scoped>
.prices {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  max-height: 500px;
  overflow-y: auto;
}

@media (max-width: 600px) {
  .prices {
    max-height: none;
  }
}

.price {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 16px;
  color: var(--color-text-muted);
}

.rarity {
  width: 100px;
  display: flex;
  justify-content: center;
}
</style>
