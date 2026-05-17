<template>
  <div class="app-container">
    <header class="app-header">
      <h1>计科院学风建设督查系统</h1>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: white;
}

.app-header {
  background-color: white;
  color: #333;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

main {
  padding: 2rem;
  background-color: white;
}
</style>