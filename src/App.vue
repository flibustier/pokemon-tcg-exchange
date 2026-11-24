<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'

import { fetchUser, saveFailed } from '@/services/api'
import { t } from '@/services/i18n'
import { isLogged } from '@/services/store'

import SiteLink from '@/components/atoms/SiteLink.vue'
import PrimaryButton from '@/components/atoms/PrimaryButton.vue'
import ThemeToggle from '@/components/atoms/ThemeToggle.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import MenuModal from './components/modals/MenuModal.vue'

onMounted(async () => {
  if (isLogged()) {
    try {
      await fetchUser()
    } catch (e) {
      console.log(e)
      // window.location.reload()
    }
  }
})
</script>

<template>
  <header class="site-header">
    <component
      :is="isLogged() ? RouterLink : SiteLink"
      class="brand"
      :to="isLogged() ? '/account/proposals' : '/'"
    >
      <h1 class="brand-name">
        <img
          alt="Pokemon Trading Card Game Pocket"
          class="logo"
          src="/images/tcgpocketlogo_en.png"
          height="100"
          id="tcg-pocket-logo"
        />
        <img alt="" class="logo" src="/images/exchange.png" id="exchange-logo" height="60" />
        Pocket Exchange Center
      </h1>
    </component>

    <div class="actions">
      <!-- On smaller screens, these are in the menu -->
      <div class="desktop-only actions">
        <SiteLink to="/help">{{ t('app.help') }}</SiteLink>
        <LanguageSwitcher />
        <ThemeToggle />
        <PrimaryButton v-if="!isLogged()" to="/login">{{ t('app.signIn') }}</PrimaryButton>
      </div>
      <MenuModal />
    </div>
  </header>
  <div class="site-separator"></div>

  <main class="app-main container">
    <RouterView />
  </main>

  <p v-if="saveFailed" class="save-error" role="alert">
    {{ t('app.saveFailed') }}
  </p>

  <footer class="container"></footer>
</template>

<style scoped>
.save-error {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: max-content;
  max-width: calc(100% - 2rem);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  color: var(--color-error-text);
  background-color: var(--color-error-surface);
  box-shadow: 0 2px 8px rgb(0 0 0 / 20%);
}

/* Not `main`: that would also be the <main> of a view, whose own rules would then win or lose by the
   order in which the styles are loaded */
.app-main {
  display: flex;
  place-items: center;
  padding: 1rem 0;
  flex: 1;
}

.container {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 1rem;
}

a {
  color: var(--text-primary);
  text-decoration: none;
}
</style>
