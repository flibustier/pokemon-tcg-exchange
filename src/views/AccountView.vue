<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import MenuButton from '@/components/atoms/MenuButton.vue'
import SettingsForm from '@/components/SettingsForm.vue'
import PricesTable from '@/components/PricesTable.vue'
import ProposalsView from '@/views/ProposalsView.vue'
import CardsGrid from '@/components/CardsGrid.vue'

const route = useRoute()

const activeRoute = computed(() => route.name)

const isCardManaging = computed(() =>
  ['wishlist', 'offers'].includes((activeRoute.value as string) ?? ''),
)
</script>

<template>
  <main>
    <div class="aside">
      <nav>
        <MenuButton label="Wishlist" icon="heart" :active="activeRoute === 'wishlist'" />
        <MenuButton label="Offers" icon="portfolio" :active="activeRoute === 'offers'" />
        <MenuButton label="Proposals" icon="exchange" :active="activeRoute === 'proposals'" />
        <MenuButton label="Account" icon="gear" :active="activeRoute === 'account'" />
      </nav>
      <PricesTable v-if="isCardManaging" :showGiving="activeRoute === 'offers'" />
    </div>
    <CardsGrid v-if="isCardManaging" :step="activeRoute === 'wishlist' ? 1 : 2" />
    <ProposalsView v-if="activeRoute === 'proposals'" />
    <SettingsForm v-if="activeRoute === 'account'" />
  </main>
</template>

<style scoped>
main {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.aside {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
  position: sticky;
  top: 125px;
  min-width: 350px;
}

nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
</style>
