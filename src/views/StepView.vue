<script setup lang="ts">
import { ref } from 'vue'
import CardsGrid from '../components/CardsGrid.vue'
import PrimaryButton from '@/components/atoms/PrimaryButton.vue'
import LoginForm from '@/components/LoginForm.vue'

const stepCompleted = ref(false)
const activeStep = ref(1)
</script>

<template>
  <main>
    <div class="aside">
      <div class="step-container">
        <div class="step-number" :class="{ active: activeStep === 1 }">1</div>
        <span class="step-text">Select the cards you are looking for </span>
        <span v-if="activeStep > 1">✅</span>
      </div>
      <div class="step-container">
        <div class="step-number" :class="{ active: activeStep === 2 }">2</div>
        <span class="step-text">Select the cards you can offer</span>
        <span v-if="activeStep > 2">✅</span>
      </div>
      <div class="step-container">
        <div class="step-number" :class="{ active: activeStep === 3 }">3</div>
        <span class="step-text">Enter your ID and match with other players !</span>
      </div>
      <div class="buttons">
        <PrimaryButton v-if="activeStep > 1" @click="activeStep--"> Previous </PrimaryButton>
        <button
          v-if="activeStep < 3"
          class="next-button"
          :disabled="!stepCompleted"
          @click="activeStep++"
        >
          Next Step
        </button>
      </div>
    </div>
    <CardsGrid v-if="activeStep < 3" v-model="stepCompleted" :step="activeStep" />
    <div v-else class="aside" style="flex-grow: 1"><LoginForm /></div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.aside {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
}

.step-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f9f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #5f6368;
  font-weight: 500;
}

.step-number.active {
  background: #00e5ff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 229, 255, 0.2);
}

.step-text {
  font-size: 18px;
  color: #5f6368;
}

.step-text.active {
  color: #00e5ff;
  font-weight: 500;
}

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

.buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
