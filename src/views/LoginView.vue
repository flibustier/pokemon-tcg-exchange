<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
</script>

<template>
  <div class="about">
    <LoginForm without-id />
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
