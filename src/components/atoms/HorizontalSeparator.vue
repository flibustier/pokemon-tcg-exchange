<template>
  <div class="hr-or">
    <slot>OR</slot>
  </div>
</template>

<style scoped>
.hr-or {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  font-size: 0.875rem;
  font-weight: 700;
  justify-content: center;
  line-height: 1.5rem;
  text-transform: uppercase;
}

.hr-or::before {
  margin-right: 0.75rem;
}
.hr-or::after {
  margin-left: 0.75rem;
}

.hr-or::after,
.hr-or::before {
  background-color: #ddd;
  content: '';
  display: inline-flex;
  height: 1px;
  width: 100%;
}
</style>
