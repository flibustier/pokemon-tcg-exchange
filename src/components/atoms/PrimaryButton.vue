<script setup lang="ts">
const emit = defineEmits(['click'])
</script>

<template>
  <button class="btn-primary" @click="emit('click')">
    <slot></slot>
  </button>
</template>

<style scoped>
.btn-primary {
  background-color: #ffffff;
  padding: 10px 40px;
  border-radius: 25px;
  border: none;
  font-size: 16px;
  box-shadow: 0 0 0 2px #00e5ff;
  text-align: center;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #f8f8f8;
}
</style>
