<script setup lang="ts">
import RarityImage from '@/components/atoms/RarityImage.vue'

// One button per rarity that a joker can cover. 'some': the joker is on in part of the sets.
export type JokerToggle = { rarity: string; state: 'on' | 'some' | 'off'; title: string }

defineProps<{
  label: string
  hint?: string
  toggles: JokerToggle[]
}>()

const emit = defineEmits<{ toggle: [rarity: string] }>()

const pressed = { on: 'true', some: 'mixed', off: 'false' } as const
</script>

<template>
  <div class="jokers">
    <span class="jokers-label">{{ label }}</span>
    <button
      v-for="{ rarity, state, title } in toggles"
      :key="rarity"
      type="button"
      class="joker"
      :class="`is-${state}`"
      :aria-pressed="pressed[state]"
      :title
      :data-rarity="rarity"
      @click="emit('toggle', rarity)"
    >
      <RarityImage :rarity />
    </button>
    <span v-if="hint" class="jokers-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.jokers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.jokers-label {
  color: var(--color-text-muted);
  font-weight: 500;
}

.jokers-hint {
  color: var(--color-text-subtle);
  font-size: 0.85rem;
}

.joker {
  height: 32px;
  padding: 0.4rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.5rem;
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease-in-out;
}

.joker.is-on {
  background-color: var(--active-color);
  border-color: transparent;
  box-shadow:
    0 2px 8px 0 var(--shadow-tinted-strong),
    inset 0 2px 8px 0 var(--shadow-tinted-strong);
}

.joker.is-some {
  border-style: dashed;
  background-color: var(--active-color);
}

.joker:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
