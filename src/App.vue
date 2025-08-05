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
      <h1>
        <img
          alt="Pokemon Trading Card Game Pocket"
          class="logo"
          src="/images/tcgpocketlogo_en.png"
          height="100"
          id="tcg-pocket-logo"
        />
        <img alt="" class="logo" src="/images/exchange.png" id="exchange-logo" height="60" />
        Exchange Center
      </h1>
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

  h1 {
    display: flex;
    align-items: center;
    line-height: 1.7rem;
    font-size: 1.6rem;
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
  gap: 2rem;
  justify-content: center;
  align-items: center;
}

a {
  color: var(--text-primary);
  text-decoration: none;
}

@media (max-width: 600px) {
  #tcg-pocket-logo {
    height: 75px;
  }
  #exchange-logo {
    height: 40px;
    margin-left: 0;
    margin-right: 0.25rem;
  }
  header {
    h1 {
      font-size: 1.2rem;
      line-height: 1.4rem;
    }
  }
  .btn-primary {
    padding: 5px 15px;
    font-size: 14px;
  }
  .actions {
    gap: 0.5rem;
  }
}
</style>
