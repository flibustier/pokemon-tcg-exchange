<script setup lang="ts">
const model = defineModel()

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="toggle-container">
    <label class="switch-label">
      <input type="checkbox" v-model="model" :disabled="disabled" class="switch-input" />
      <span class="switch-slider"></span>
      <span class="switch-text">
        <slot />
      </span>
    </label>
  </div>
</template>

<style scoped>
.toggle-container {
  margin-bottom: 0.5rem;
}
.switch-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.switch-input {
  display: none;
}
.switch-slider {
  width: 40px;
  height: 20px;
  background: #e5e7eb;
  border-radius: 20px;
  position: relative;
  transition: background 0.2s;
  margin-right: 12px;
}
.switch-slider::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.switch-input:checked + .switch-slider {
  background: #5fd5ff;
}
.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}
.switch-text {
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
}
</style>
