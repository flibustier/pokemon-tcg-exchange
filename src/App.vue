<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()

import { isLogged } from '@/services/store'

import PrimaryButton from '@/components/atoms/PrimaryButton.vue'
</script>

<template>
  <header class="container">
    <div class="brand" @click="router.push('/')">
      <img
        alt="Pokemon Trading Card Game Pocket"
        class="logo"
        src="/images/tcgpocketlogo_en.png"
        height="125"
      />
      <img
        alt="Exchange"
        class="logo"
        src="/images/exchange.png"
        height="75"
        style="margin: 0 0.5rem"
      />
      <h1>Exchange Center</h1>
    </div>

    <div class="actions">
      <PrimaryButton v-if="isLogged()" @click="router.push('/proposals')">Proposals</PrimaryButton>
      <!--PrimaryButton v-else @click="router.push('/login')">Sign In</!--PrimaryButton-->
    </div>
  </header>
  <div class="separator"></div>

  <main class="container">
    <RouterView />
  </main>

  <footer class="container"></footer>
</template>

<style scoped>
header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1,
  button {
    color: var(--text-primary);
  }
}

.brand {
  display: flex;
  align-items: center;

  padding-right: 1rem;

  cursor: pointer;
}

.brand:hover {
  background-color: #e9f2f782;
  border-radius: 10px;
}

main {
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

.separator {
  height: 5px;
  width: 100%;
  background: linear-gradient(to right, #ff69b4, #4169e1, #40e0d0);
  background-size: 300% 100%;
  animation: gradientAnimation 6s infinite;
}

@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 1000;
  flex-shrink: 0;
}
</style>
