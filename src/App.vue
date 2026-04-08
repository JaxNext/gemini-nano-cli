<script setup lang="ts">
import ChatBot from './components/ChatBot.vue'
</script>

<template>
  <main class="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_40%),_radial-gradient(circle_at_bottom_left,_var(--tw-gradient-to),_transparent_40%)] from-primary/5 via-background to-primary/5">
    <ChatBot />
  </main>
</template>

<style>
:root {
  --primary: 220 80% 50%;
  --primary-foreground: 0 0% 100%;
}

body {
  overflow-x: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
}
</style>
