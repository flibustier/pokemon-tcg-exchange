<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
})

const isVisible = defineModel<boolean>()

const closeModal = () => {
  isVisible.value = false
}
</script>

<template>
  <div class="modal" v-if="isVisible" @click="closeModal">
    <div class="modal-content" @click.stop="">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button class="close" @click="closeModal" title="Close this dialog" />
      </div>
      <div class="column modal-body">
        <slot></slot>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  z-index: 2;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
  display: flex;
}

.modal-content {
  align-self: center;
  background-color: var(--color-background);
  margin: auto;
  padding: 1.5rem;
  border: 1px solid var(--primary-color);
  border-radius: 5px;
  max-width: var(--max-width);
}

.close {
  background: none;
  border: 1px solid var(--primary-color);
  border-radius: 100%;
  padding: 0 0.5rem;
  font-weight: bold;
}

.close::after {
  display: inline-block;
  content: '\00d7'; /* This will render the 'X' */
  color: var(--primary-color);
}

.close:hover,
.close:focus {
  cursor: pointer;
}

.modal-header {
  display: flex;
  justify-content: space-between;
}

.modal-header h2 {
  font-weight: 500;
  font-size: 1rem;
  text-transform: uppercase;
  text-align: center;
}

.modal-body {
  margin-top: 1rem;
}
</style>
