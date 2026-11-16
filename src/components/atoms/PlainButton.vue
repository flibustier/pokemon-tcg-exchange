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
  background: var(--accent);
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  color: var(--on-accent);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--accent-shadow);
  transition: all 0.2s ease;
}

.next-button:hover {
  background: var(--accent-hover);
  box-shadow: 0 6px 16px var(--accent-shadow-strong);
}

.next-button:active {
  box-shadow: 0 2px 8px var(--accent-shadow);
}

.next-button:disabled {
  background: var(--color-disabled);
  color: var(--on-disabled);
  cursor: not-allowed;
  box-shadow: none;
}
</style>
