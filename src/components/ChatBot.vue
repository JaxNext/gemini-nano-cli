<script setup lang="ts">
import { ref } from 'vue'
import { useChatEngine } from '@/composables/useChatEngine'
import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'
import ChatSidebar from './ChatSidebar.vue'

const { 
  sessions, 
  activeSessionId, 
  messages, 
  isGenerating,
  loadSession,
  createNewSession,
  deleteSession,
  renameSession,
  sendMessage,
} = useChatEngine()

const input = ref('')

const handleSelectSession = (id: string) => {
  loadSession(id)
}

const handleNewSession = async () => {
  await createNewSession()
}

const handleDeleteSession = async (id: string) => {
  await deleteSession(id)
}

const handleRenameSession = async (id: string, newTitle: string) => {
  await renameSession(id, newTitle)
}

const handleSubmit = async () => {
  if (!input.value.trim() || isGenerating.value || !activeSessionId.value) return
  
  const userText = input.value
  input.value = ''
  
  await sendMessage(userText)
}
</script>

<template>
  <div class="flex h-full w-full bg-gradient-to-b from-background/50 to-muted/20">
    <!-- Sidebar -->
    <ChatSidebar 
      :sessions="sessions" 
      :active-session-id="activeSessionId"
      @select="handleSelectSession"
      @new="handleNewSession"
      @delete="handleDeleteSession"
      @rename="handleRenameSession"
    />
    
    <!-- Main Chat Area -->
    <div class="flex flex-col flex-1 min-w-0 bg-background/30">
      <!-- Chat Header -->
      <ChatHeader />

      <!-- Messages Area -->
      <ChatMessages :messages="messages" :is-loading="isGenerating" />

      <!-- Input Area -->
      <ChatInput v-model="input" :is-loading="isGenerating" @submit="handleSubmit" />
    </div>
  </div>
</template>
