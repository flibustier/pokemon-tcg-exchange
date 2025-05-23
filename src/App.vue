<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()

import { fetchUser } from '@/services/api'
import { isLogged, setLogOut } from '@/services/store'

import PrimaryButton from '@/components/atoms/PrimaryButton.vue'

onMounted(async () => {
  if (isLogged()) {
    try {
      await fetchUser()
    } catch (e) {
      console.log(e)
      setLogOut()
      window.location.reload()
    }
  }
})
</script>

<template>
  <header class="container">
    <div class="brand" @click="router.push(isLogged() ? '/account' : '/')">
      <img
        alt="Pokemon Trading Card Game Pocket"
        class="logo"
        src="/images/tcgpocketlogo_en.png"
        height="125"
        id="tcg-pocket-logo"
      />
      <img alt="Exchange" class="logo" src="/images/exchange.png" id="exchange-logo" height="75" />
      <h1>Exchange Center</h1>
    </div>

    <div class="actions">
      <RouterLink to="/help"> Help & FAQ </RouterLink>
      <PrimaryButton v-if="isLogged()" @click="router.push('/logout')">Logout</PrimaryButton>
      <PrimaryButton v-else @click="router.push('/login')">Sign In</PrimaryButton>
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

#exchange-logo {
  margin: 0 0.5rem;
}

@media (max-width: 600px) {
  #tcg-pocket-logo {
    height: 75px;
  }
  #exchange-logo {
    height: 50px;
  }
  h1 {
    font-size: 1.5rem;
  }
  .btn-primary {
    padding: 10px 20px;
    font-size: 14px;
  }
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

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

a {
  color: var(--text-primary);
  text-decoration: none;
}
</style>
