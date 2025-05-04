<script setup lang="ts">
const emit = defineEmits(['click'])

defineProps<{
  disabled?: boolean
}>()
</script>

<template>
  <button class="next-button" @click="emit('click')" :disabled="disabled">
    <slot></slot>
  </button>
</template>

<style scoped>
.next-button {
  background: #5fd5ff;
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(95, 213, 255, 0.2);
  transition: all 0.2s ease;
}

.next-button:hover {
  background: #4cccff;
  box-shadow: 0 6px 16px rgba(95, 213, 255, 0.3);
}

.next-button:active {
  box-shadow: 0 2px 8px rgba(95, 213, 255, 0.2);
}

.next-button:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
