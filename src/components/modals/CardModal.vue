<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/modals/BaseModal.vue'
import { rarities, type Card } from '@/services/cards'

defineProps<{
  card: Card
}>()

const isVisible = ref(false)

const showModal = () => {
  console.log('showModal')
  isVisible.value = true
}

defineExpose({ showModal })
</script>

<template>
  <BaseModal v-model="isVisible" :title="card.name + ` (${card.id})`">
    <div class="flex">
      <img
        :src="`/images/cards/${card.image}`"
        class="responsive-image"
        width="367"
        height="512"
        :alt="card.name"
        loading="lazy"
      />
      <div class="column">
        <img
          :src="`/images/sets/LOGO_expansion_${card.set}_en_US.webp`"
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
            width="160"
            loading="lazy"
          />
        </div>

        <div class="row">
          <img src="/images/shinedust.webp" width="28" height="28" alt="Shine dust cost" />

          <span>{{ rarities[card.rarity as keyof typeof rarities].tradePrice }}</span>
        </div>
        <div class="row">
          <img src="/images/BoosterPoints.png" height="32" alt="Shine dust cost" />

          <span>{{ rarities[card.rarity as keyof typeof rarities].points }}</span>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

img.responsive-image {
  max-inline-size: 100%;
  block-size: auto;
}
</style>
