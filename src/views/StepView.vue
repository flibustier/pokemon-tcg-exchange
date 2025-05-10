<script setup lang="ts">
import { ref, computed } from 'vue'

import PrimaryButton from '@/components/atoms/PrimaryButton.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'
import CardsGrid from '@/components/CardsGrid.vue'
import LoginForm from '@/components/LoginForm.vue'
import PricesTable from '@/components/PricesTable.vue'

import { isWantedStepCompleted, isGivingStepCompleted } from '@/services/store'

const stepCompleted = computed(() => {
  if (activeStep.value === 1) {
    return isWantedStepCompleted.value
  } else if (activeStep.value === 2) {
    return isGivingStepCompleted.value
  } else {
    return false
  }
})
const activeStep = ref(1)
</script>

<template>
  <main>
    <div class="aside" :class="{ 'hidden-sm': activeStep === 3 }">
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
        <PlainButton v-if="activeStep < 3" :disabled="!stepCompleted" @click="activeStep++">
          Next Step
        </PlainButton>
        <PrimaryButton v-if="activeStep === 2" @click="activeStep--"> Previous </PrimaryButton>
      </div>
      <PricesTable
        id="prices"
        v-if="activeStep < 3 && isWantedStepCompleted"
        :showGiving="activeStep === 2"
      />
    </div>
    <CardsGrid v-if="activeStep < 3" v-model="stepCompleted" :step="activeStep" id="cards-grid" />
    <div v-else class="content">
      <h2 class="hidden-xl">Enter your ID and match with other players !</h2>
      <LoginForm />
      <div class="buttons" style="max-width: 335px">
        <PrimaryButton @click="activeStep--"> Previous </PrimaryButton>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.aside {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3rem;
  position: sticky;
  top: 125px;
  min-width: 360px;
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

.buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.content {
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-direction: column;
  gap: 1rem;
}

.hidden-xl {
  display: none;
}

@media (max-width: 1111px) {
  main {
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .aside {
    position: fixed;
    height: auto;
    top: auto;
    bottom: 0;
    z-index: 11;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    width: 100%;
    min-width: 100%;
    background-color: white;

    #prices {
      display: none;
    }
  }
  #cards-grid {
    margin-bottom: 180px;
  }
  .hidden-xl {
    display: block;
    margin-bottom: 1rem;
  }
  .hidden-sm {
    display: none;
  }
}
</style>
