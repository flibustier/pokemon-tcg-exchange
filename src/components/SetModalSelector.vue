<script setup lang="ts">
defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:isVisible"]);

const closeModal = () => {
  emit("update:isVisible", false);
  window.location.hash = "";
};
</script>

<template>
  <div class="modal" v-if="isVisible" @click="closeModal">
    <div class="modal-content" @click.stop="">
      <div class="modal-header">
        <h2>{{ title }}</h2>
      </div>
      <div class="column modal-body">
        <slot></slot>
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
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  max-width: var(--max-width);
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

.modal-footer {
  margin-top: 1rem;
  font-size: 0.8rem;
  line-height: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: end;
}
</style>
