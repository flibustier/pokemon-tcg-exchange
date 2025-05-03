<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  label: string
  icon: string
  active?: boolean
}>()

const navigate = () => router.push({ name: props.label.toLowerCase() })
</script>

<template>
  <button class="portfolio-btn" :class="{ active }" @click="navigate">
    <span class="icon">
      <!-- Simple book icon SVG -->
      <svg v-if="icon === 'portfolio'" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect
          x="6"
          y="6"
          width="14"
          height="20"
          rx="2"
          stroke="#444"
          stroke-width="2"
          fill="#fff"
        />
        <rect
          x="10"
          y="12"
          width="6"
          height="6"
          rx="1"
          stroke="#444"
          stroke-width="1.5"
          fill="#fff"
        />
        <rect x="8" y="8" width="14" height="20" rx="2" stroke="#bbb" stroke-width="1" />
      </svg>
      <svg
        v-else-if="icon === 'heart'"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b4252"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19.5 12.572l-7.5 7.428l-7.5-7.428a5 5 0 1 1 7.5-6.566a5 5 0 1 1 7.5 6.572" />
      </svg>
      <svg
        v-else-if="icon === 'gear'"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3b4252"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
      <img src="/images/icons/exchange.svg" v-if="icon === 'exchange'" width="32" height="32" />
    </span>
    <span class="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.portfolio-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 8rem;
  height: 6rem;
  background: #f8fafc;
  border: none;
  border-radius: 22px;
  box-shadow: 0 6px 16px 0 rgba(60, 60, 120, 0.13);
  cursor: pointer;
  transition: box-shadow 0.2s;
  font-family: sans-serif;
}

.portfolio-btn .icon {
  margin-bottom: 8px;
}

.portfolio-btn .label {
  color: #6b7280;
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Active state */
.portfolio-btn.active,
.portfolio-btn:active {
  box-shadow:
    0 2px 8px 0 rgba(60, 60, 120, 0.18),
    inset 0 2px 8px 0 rgba(60, 60, 120, 0.16);
  background: #e6f9f2;
}

.portfolio-btn.active .icon,
.portfolio-btn:active .icon {
  filter: drop-shadow(0 0 8px #32e37c88);
}
</style>
