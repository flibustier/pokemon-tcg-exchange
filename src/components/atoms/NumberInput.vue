<script setup lang="ts">
const model = defineModel<number>()

const increase = () => {
  model.value = (model.value || 0) + 1
}
const decrease = () => {
  model.value = (model.value || 0) - 1
}
</script>

<template>
  <div class="wrap">
    <div class="btns">
      <button type="button" :disabled="(model || 0) < 1" @click="decrease" />
      <button type="button" class="plus-button" @click="increase" />
    </div>

    <input v-model="model" type="number" autocomplete="on" step="1" min="0" />
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
}

.btns {
  display: flex;
  gap: 0.5rem;
}

button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #f1f9f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: pointer;
}

button:hover {
  background: #e8f3e8;
}

.plus-button::after,
button::before {
  content: '';
  position: absolute;
  background: #5f6368;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

button::before {
  width: 10px;
  height: 2px;
}

.plus-button::after {
  width: 2px;
  height: 10px;
}

button:disabled {
  background: #f1f1f1;
  cursor: not-allowed;
  box-shadow: none;
}

button:disabled::before,
.plus-button:disabled::after {
  background: #ccc;
}

input {
  height: 24px;
  width: 60px;
  border: none;
  border-radius: 10px;
  background: #fff;
  text-align: center;
  font-size: 16px;
  color: #5f6368;
  box-shadow: 0 0 0 2px rgba(95, 99, 104, 0.1);

  padding: 0;
  margin: 0 4px;
  -moz-appearance: textfield;
}

/* Remove default number input arrows for Chrome/Safari/Edge */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Style for focused state */
input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(126, 178, 242, 0.5);
}

/* Style for disabled state */
input:disabled {
  background: #f1f1f1;
  color: #ccc;
  cursor: not-allowed;
}
</style>
