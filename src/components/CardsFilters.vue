<script setup lang="ts">
import { computed } from 'vue'

import RarityImage from '@/components/atoms/RarityImage.vue'

import { rarities } from '@/services/cards'

const props = defineProps<{
  cards: { rarity: string }[]
  languages?: string[]
  pseudonyms?: string[]
}>()

const filters = defineModel<{
  raritySelection: string[]
  languageSelection?: string[]
  pseudonymSelection?: string[]
  hideUnavailable?: boolean
  hideEmpty?: boolean
  cardName?: string
}>({
  required: true,
})

const rarityOptions = computed(() => {
  return Array.from(new Set(props.cards.map(({ rarity }) => (rarity === 'SAR' ? 'SR' : rarity))))
})

const toggle =
  (filterList: 'raritySelection' | 'languageSelection' | 'pseudonymSelection') =>
  (toToggle: string) => {
    if (!filters.value[filterList]) {
      console.warn(`${filterList} not found in v-model of CardsFilters`)
      return
    }
    if (filters.value[filterList].includes(toToggle)) {
      filters.value[filterList] = filters.value[filterList].filter((entry) => entry !== toToggle)
    } else {
      filters.value[filterList].push(toToggle)
    }
  }

const toggleRarity = (rarity: string) => {
  // Ensure SR and SAR are toggled together
  if (rarity === 'SR') {
    toggle('raritySelection')('SAR')
  }
  toggle('raritySelection')(rarity)
}
const toggleLanguage = toggle('languageSelection')
const togglePseudonym = toggle('pseudonymSelection')
</script>

<template>
  <div class="filters">
    <label>Filters</label>

    <div
      class="badge"
      :class="{
        'is-active':
          filters.raritySelection.includes(rarity) || filters.raritySelection.length === 0,
      }"
      v-for="rarity in rarityOptions"
      :key="rarity"
      :title="rarities[rarity as keyof typeof rarities].label || ''"
      @click="toggleRarity(rarity)"
    >
      <RarityImage :rarity />
    </div>
    <div
      v-if="filters.hideUnavailable != undefined"
      class="badge badge--unavailable"
      :class="{ 'is-active': !filters.hideUnavailable }"
      title="Display restricted cards or cards you’re already looking for"
      @click="filters.hideUnavailable = !filters.hideUnavailable"
    >
      🚫
    </div>
    <div
      v-if="filters.hideEmpty != undefined"
      class="badge badge--unavailable"
      :class="{ 'is-active': !filters.hideEmpty }"
      title="Display cards you haven’t already selected"
      @click="filters.hideEmpty = !filters.hideEmpty"
    >
      0️⃣
    </div>
    <template v-if="languages">
      <div
        class="badge"
        :class="{
          'is-active':
            filters.languageSelection?.includes(language) ||
            filters.languageSelection?.length === 0,
        }"
        v-for="language in languages"
        :key="language"
        @click="toggleLanguage(language)"
      >
        {{ language }}
      </div>
    </template>
    <div style="margin-left: 0.5rem">
      <input
        v-model="filters.cardName"
        class="input-search"
        type="text"
        placeholder="Search for card name"
      />
    </div>
  </div>
  <div class="filters" v-if="pseudonyms">
    <label class="filters__title">Players</label>
    <div
      class="badge"
      :class="{
        'is-active':
          filters.pseudonymSelection?.includes(pseudonym) ||
          filters.pseudonymSelection?.length === 0,
      }"
      v-for="pseudonym in pseudonyms"
      :key="pseudonym"
      @click="togglePseudonym(pseudonym)"
    >
      {{ pseudonym }}
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.filters:not(:first-child) {
  margin-top: 0.5rem;
}

.badge {
  height: 25px;
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
}

.badge--unavailable {
  margin-left: 0.5rem;
  height: 30px;
}

.badge.is-active {
  background-color: #e6f9f2;
  box-shadow:
    0 2px 8px 0 rgba(60, 60, 120, 0.18),
    inset 0 2px 8px 0 rgba(60, 60, 120, 0.16);
  border-color: transparent;
}

.input-search {
  height: 30px;
  padding: 0 0.5rem;
  border-radius: 1rem;
  border: 1px solid #9cc;
}
</style>
