<script setup lang="ts">
import { capitalize } from 'vue'

const props = defineProps<{
  route: string
  label?: string
  withNotificationDot?: boolean
}>()
</script>

<template>
  <RouterLink class="portfolio-btn" :to="{ name: props.route }">
    <span class="icon">
      <slot />
    </span>
    <span
      class="label"
      :class="{
        'notification-dot': withNotificationDot,
      }"
    >
      {{ label || capitalize(route) }}
    </span>
  </RouterLink>
</template>

<style scoped>
.icon {
  display: flex;
  scale: 2;
}

.portfolio-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 4rem;
  padding: 1.5rem;
  gap: 1rem;
  background: #f8fafc;
  border: none;
  border-radius: 22px;
  box-shadow: 0 6px 16px 0 rgba(60, 60, 120, 0.13);
  cursor: pointer;
  transition: box-shadow 0.2s;
  font-family: sans-serif;
  text-decoration: none;
  color: #6b7280;
}

.label {
  font-size: 1.05rem;
}

.label.notification-dot::after {
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

.portfolio-btn:hover,
.portfolio-btn.router-link-active,
.portfolio-btn:active {
  box-shadow:
    0 2px 8px 0 rgba(60, 60, 120, 0.18),
    inset 0 2px 8px 0 rgba(60, 60, 120, 0.16);
  background: #e6f9f2;

  .icon {
    filter: drop-shadow(0 0 8px #32e37c88);
  }
}
</style>
