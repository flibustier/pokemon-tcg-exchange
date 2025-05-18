<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import MenuButton from '@/components/atoms/MenuButton.vue'
import SettingsForm from '@/components/SettingsForm.vue'
import PricesTable from '@/components/PricesTable.vue'
import ProposalsView from '@/views/ProposalsView.vue'
import CardsGrid from '@/components/CardsGrid.vue'
import PacksInformations from '@/components/PacksInformations.vue'
import CenteredLayout from '@/layouts/CenteredLayout.vue'

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
      <PricesTable id="prices" v-if="isCardManaging" :showGiving="activeRoute === 'offers'" />
    </div>
    <div class="content">
      <CardsGrid v-if="isCardManaging" :step="activeRoute === 'wishlist' ? 1 : 2" />
      <ProposalsView v-if="activeRoute === 'proposals'" />
      <CenteredLayout v-if="activeRoute === 'account'" style="gap: 2rem">
        <h2>Settings</h2>
        <SettingsForm />
        <PacksInformations />
      </CenteredLayout>
    </div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.content {
  width: 100%;
}

.aside {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
  position: sticky;
  top: 125px;
  min-width: 310px;
}

nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

@media (max-width: 1111px) {
  main {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .aside {
    position: fixed;
    height: auto;
    top: auto;
    bottom: 0;
    z-index: 11;
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin-bottom: 1rem;
    width: 100%;
    min-width: 100%;

    #prices {
      display: none;
    }
  }
  .content {
    margin-bottom: 80px;
  }
  nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
