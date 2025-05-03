<template>
  <div class="account-layout">
    <div class="account-layout__header">
      <h1 class="account-layout__title">Account</h1>
    </div>
    <div class="account-layout__content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.account-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
.account-layout__header {
  margin-bottom: 20px;
}
.account-layout__title {
  font-size: 24px;
  font-weight: bold;
}
.account-layout__content {
  width: 100%;
  max-width: 800px;
}
</style>
