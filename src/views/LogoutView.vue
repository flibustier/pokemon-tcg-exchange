<script setup lang="ts">
import { setLogOut } from '@/services/store'

setLogOut()

window.location.replace('/')
</script>

<template>
  <div class="about">
    <h1>Logging out...</h1>
  </div>
</template>

<style>
.about {
  min-height: 80vh;
  display: flex;
  align-items: center;
  width: 100%;
}
</style>
