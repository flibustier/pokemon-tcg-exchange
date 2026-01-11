<script setup lang="ts">
import { useTemplateRef } from 'vue'
import CardModal from '../modals/CardModal.vue'
import type { Card } from '@/services/cards'

const modal = useTemplateRef('modal')

defineProps<{
  card: Card
}>()
</script>

<template>
  <img
    :src="`/images/cards/thumbnails/${card.image}`"
    :alt="card.name"
    class="card-thumbnail"
    width="135"
    height="188"
    loading="lazy"
    :title="card.id"
    @click="() => modal?.showModal()"
  />
  <CardModal :card ref="modal" />
</template>

<style scoped>
.card-thumbnail {
  cursor: pointer;
}
</style>
