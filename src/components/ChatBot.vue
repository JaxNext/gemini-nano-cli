<script setup lang="ts">
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

const handleSubmit = async (message: { text: string, files: any[] }) => {
  if (isGenerating.value || !activeSessionId.value) return
  if (!message.text.trim() && message.files.length === 0) return
  
  await sendMessage(message.text, message.files)
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
    <div class="flex flex-col flex-1 min-w-0 min-h-0 bg-background/30 overflow-hidden">
      <!-- Chat Header -->
      <ChatHeader />

      <!-- Messages Area -->
      <ChatMessages :messages="messages" :is-loading="isGenerating" />

      <!-- Input Area -->
      <ChatInput :is-loading="isGenerating" @submit="handleSubmit" />
    </div>
  </div>
</template>
