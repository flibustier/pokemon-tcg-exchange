<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import SiteLink from '../atoms/SiteLink.vue'

import CardIcon from '../icons/CardIcon.vue'
import GearIcon from '../icons/GearIcon.vue'
import HeartIcon from '../icons/HeartIcon.vue'
import CrossIcon from '../icons/CrossIcon.vue'
import ChartIcon from '../icons/ChartIcon.vue'
import MessageIcon from '../icons/MessageIcon.vue'
import ExchangeIcon from '../icons/ExchangeIcon.vue'
import QuestionIcon from '../icons/QuestionIcon.vue'
import UserIcon from '../icons/UserIcon.vue'
import MoonIcon from '../icons/MoonIcon.vue'
import SunIcon from '../icons/SunIcon.vue'
import GlobeIcon from '../icons/GlobeIcon.vue'
import LanguageSwitcher from '../LanguageSwitcher.vue'

import { hasUnreadMessages, isAccountIncomplete, isLogged } from '@/services/store'
import { t } from '@/services/i18n'
import { toggleTheme } from '@/services/theme'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <button class="burger-menu mobile-only" :aria-label="t('app.menu')" @click="toggleMenu">
    <svg viewBox="0 0 100 80" width="24" height="24" fill="currentColor">
      <rect width="100" height="15" rx="8"></rect>
      <rect y="30" width="100" height="15" rx="8"></rect>
      <rect y="60" width="100" height="15" rx="8"></rect>
    </svg>
  </button>

  <Teleport to="body">
    <div v-if="isMenuOpen" class="mobile-menu-modal">
      <div class="modal-header">
        <button class="close-btn" @click="toggleMenu">
          <CrossIcon />
        </button>
      </div>
      <nav v-if="!isLogged()" class="mobile-nav">
        <RouterLink class="menu-item" :to="{ name: 'login' }" @click="toggleMenu">
          <span class="icon">
            <UserIcon />
          </span>
          <span>{{ t('app.signIn') }}</span>
        </RouterLink>
        <SiteLink class="menu-item" to="/help">
          <span class="icon">
            <QuestionIcon />
          </span>
          <span>{{ t('app.help') }}</span>
        </SiteLink>
        <!-- The menu stays open: the player sees the new theme at once -->
        <button type="button" class="menu-item" @click="toggleTheme">
          <span class="icon">
            <MoonIcon class="if-light" />
            <SunIcon class="if-dark" />
          </span>
          <span class="if-light">{{ t('theme.dark') }}</span>
          <span class="if-dark">{{ t('theme.light') }}</span>
        </button>
        <div class="menu-item">
          <span class="icon">
            <GlobeIcon />
          </span>
          <LanguageSwitcher />
        </div>
      </nav>
      <nav v-else class="mobile-nav">
        <RouterLink class="menu-item" :to="{ name: 'wishlist' }" @click="toggleMenu">
          <span class="icon">
            <HeartIcon />
          </span>
          <span>{{ t('menu.wishlist') }}</span>
        </RouterLink>
        <RouterLink class="menu-item" :to="{ name: 'offers' }" @click="toggleMenu">
          <span class="icon">
            <CardIcon />
          </span>
          <span>{{ t('menu.offers') }}</span>
        </RouterLink>
        <RouterLink class="menu-item" :to="{ name: 'proposals' }" @click="toggleMenu">
          <span class="icon">
            <ExchangeIcon />
          </span>
          <span>{{ t('menu.proposals') }}</span>
        </RouterLink>
        <RouterLink class="menu-item" :to="{ name: 'messages' }" @click="toggleMenu">
          <span class="icon">
            <MessageIcon />
          </span>
          <span
            :class="{
              'notification-dot': hasUnreadMessages,
            }"
          >
            {{ t('menu.messages') }}
          </span>
        </RouterLink>
        <RouterLink class="menu-item" :to="{ name: 'settings' }" @click="toggleMenu">
          <span class="icon">
            <GearIcon />
          </span>
          <span
            :class="{
              'notification-dot': isAccountIncomplete,
            }"
          >
            {{ t('menu.settings') }}
          </span>
        </RouterLink>
        <RouterLink class="menu-item" :to="{ name: 'insights' }" @click="toggleMenu">
          <span class="icon">
            <ChartIcon />
          </span>
          <span>{{ t('menu.insights') }}</span>
        </RouterLink>
        <SiteLink class="menu-item" to="/help">
          <span class="icon">
            <QuestionIcon />
          </span>
          <span>{{ t('app.help') }}</span>
        </SiteLink>
        <button type="button" class="menu-item" @click="toggleTheme">
          <span class="icon">
            <MoonIcon class="if-light" />
            <SunIcon class="if-dark" />
          </span>
          <span class="if-light">{{ t('theme.dark') }}</span>
          <span class="if-dark">{{ t('theme.light') }}</span>
        </button>
        <div class="menu-item">
          <span class="icon">
            <GlobeIcon />
          </span>
          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  </Teleport>
</template>

<style scoped>
.mobile-only {
  display: flex;
}

/* Same width as the header and the account menu, which hide below it */
@media (min-width: 1112px) {
  .mobile-only {
    display: none;
  }
}

.burger-menu {
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-menu-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--color-background);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
  overflow-y: scroll;
}

.modal-header {
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-primary);
  padding: 0.5rem;
  scale: 2;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 0.25rem;
  height: 100%;
  max-height: 500px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  gap: 1.5rem;
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
}

button.menu-item {
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}

.menu-item .language {
  margin-left: -0.5rem;
}

.menu-item:hover {
  background-color: var(--color-surface-hover);
}

.menu-item.router-link-active {
  font-weight: 600;
  color: var(--primary-color);

  .icon :deep(svg) {
    stroke: var(--primary-color);
  }
}

.menu-item .icon {
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    stroke: var(--text-primary);
    width: 28px;
    height: 28px;
  }
}

.notification-dot::after {
  content: '';
  display: inline-block;
  position: relative;
  top: -10px;
  left: 5px;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #f0f;
}
</style>
