<template>
  <div class="centered-layout">
    <slot />
  </div>
</template>

<style scoped>
.centered-layout {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: center;
}
</style>
