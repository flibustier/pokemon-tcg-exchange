<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import { rarities, type Card } from '@/services/cards'
import { cardName, cardSetLogo, t } from '@/services/i18n'

defineProps<{
  card: Card
}>()

const isVisible = ref(false)

const showModal = () => {
  isVisible.value = true
}

defineExpose({ showModal })
</script>

<template>
  <BaseModal v-model="isVisible" :title="`${cardName(card)} (${card.id})`">
    <div class="flex">
      <img
        :src="card.imagePaths.full"
        class="responsive-image"
        width="367"
        height="512"
        :alt="cardName(card)"
        loading="lazy"
      />
      <div class="column">
        <img
          :src="cardSetLogo(card)"
          :alt="card.set"
          class="responsive-image"
          width="256"
          loading="lazy"
        />
        <div class="row" style="overflow-x: scroll">
          <img
            v-for="pack in card.packs"
            :key="pack"
            :src="`/images/packs/${pack}.webp`"
            :alt="pack"
            class="responsive-image"
            height="192"
            width="120"
            loading="lazy"
          />
        </div>

        <div class="row">
          <img src="/images/shinedust.webp" width="28" height="28" :alt="t('app.shinedust')" />

          <span>{{ rarities[card.rarity as keyof typeof rarities].tradePrice }}</span>
        </div>
        <div class="row">
          <img src="/images/BoosterPoints.png" height="32" :alt="t('app.boosterPoints')" />

          <span>{{ (rarities[card.rarity as keyof typeof rarities] as { points?: number }).points ?? '–' }}</span>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.flex {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.row,
.column {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.column {
  flex-direction: column;
}

img.responsive-image {
  max-inline-size: 100%;
  block-size: auto;
}
</style>
