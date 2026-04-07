<script setup lang="ts">
import { ref } from 'vue'
import { Card } from '@/components/ui/card'
import ChatHeader from './ChatHeader.vue'
import ChatMessages, { type ChatMessage } from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'

const messages = ref<ChatMessage[]>([
  { 
    id: '1', 
    role: 'assistant', 
    content: 'Welcome to the Gemini Nano sandbox! I am running locally in your browser. How can I help you today?' 
  },
])

const input = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!input.value.trim() || isLoading.value) return
  
  const userText = input.value
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userText
  })
  
  input.value = ''
  isLoading.value = true
  
  // Simulated AI response
  setTimeout(async () => {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `That's an interesting question about "${userText}". Since I'm a local model, I can respond quickly without any API calls! How else can I assist?`
    })
    isLoading.value = false
  }, 1000)
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh] p-4 md:p-8">
    <Card class="w-full max-w-4xl h-[700px] flex flex-col shadow-2xl border-primary/10 overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <!-- Chat Header -->
      <ChatHeader />

      <!-- Messages Area -->
      <ChatMessages :messages="messages" :is-loading="isLoading" />

      <!-- Input Area -->
      <ChatInput v-model="input" :is-loading="isLoading" @submit="handleSubmit" />
    </Card>
  </div>
</template>