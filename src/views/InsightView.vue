<script setup lang="ts">
import PacksInformations from '@/components/PacksInformations.vue'
import PricesTable from '@/components/PricesTable.vue'
import CenteredLayout from '@/layouts/CenteredLayout.vue'
</script>

<template>
  <CenteredLayout>
    <h2 style="margin-bottom: 2rem">Some insights to fulfill your collection</h2>
    <div class="flex-wrap">
      <PricesTable id="prices" show-giving />
      <PacksInformations />
    </div>
  </CenteredLayout>
</template>

<style scoped>
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
}
</style>
