<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { hasUnreadMessages, isAccountIncomplete } from '@/services/store'

import MessagesView from '@/views/MessagesView.vue'
import ProposalsView from '@/views/ProposalsView.vue'
import CenteredLayout from '@/layouts/CenteredLayout.vue'
import BetaAccessForm from '@/components/forms/BetaAccessForm.vue'
import SettingsForm from '@/components/forms/SettingsForm.vue'
import MenuButton from '@/components/atoms/MenuButton.vue'
import CardsGrid from '@/components/CardsGrid.vue'
import InsightView from './InsightView.vue'
import HeartIcon from '@/components/icons/HeartIcon.vue'
import CardIcon from '@/components/icons/CardIcon.vue'
import ExchangeIcon from '@/components/icons/ExchangeIcon.vue'
import MessageIcon from '@/components/icons/MessageIcon.vue'
import GearIcon from '@/components/icons/GearIcon.vue'
import ChartIcon from '@/components/icons/ChartIcon.vue'

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
        <MenuButton route="wishlist"><HeartIcon /></MenuButton>
        <MenuButton route="offers"><CardIcon /></MenuButton>
        <MenuButton route="proposals"><ExchangeIcon /></MenuButton>
        <MenuButton route="messages" :with-notification-dot="hasUnreadMessages">
          <MessageIcon />
        </MenuButton>
        <MenuButton label="Account" route="settings" :with-notification-dot="isAccountIncomplete">
          <GearIcon />
        </MenuButton>
        <MenuButton route="insights"><ChartIcon /></MenuButton>
      </nav>
    </div>
    <div class="content">
      <CardsGrid v-if="isCardManaging" :step="activeRoute === 'wishlist' ? 1 : 2" />
      <ProposalsView v-if="activeRoute === 'proposals'" />
      <CenteredLayout v-if="activeRoute === 'settings' || activeRoute === 'account'">
        <SettingsForm />
      </CenteredLayout>
      <CenteredLayout v-if="activeRoute === 'beta'">
        <BetaAccessForm />
      </CenteredLayout>
      <MessagesView v-if="(activeRoute as string).startsWith('message')" />
      <InsightView v-if="activeRoute === 'insights'" />
    </div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
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
  min-width: fit-content;
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
    display: none;
  }
}
</style>
