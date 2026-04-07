<script setup lang="ts">
import { ref } from 'vue'
import { Card } from '@/components/ui/card'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { useGeminiNano } from '@/composables/useGeminiNano'
import ChatHeader from './ChatHeader.vue'
import ChatMessages, { type ChatMessage } from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'
import ChatSidebar, { type ChatSession } from './ChatSidebar.vue'

const { promptStreaming, resetSession } = useGeminiNano()

// Helper to strip Vue proxies for IndexedDB structured clone
const cloneDeep = <T>(val: T): T => JSON.parse(JSON.stringify(val))

// Persist state in IndexedDB
const { data: sessions } = useIDBKeyval<ChatSession[]>('gemini-nano-sessions', [])

const { data: activeSessionId } = useIDBKeyval<string>('gemini-nano-active-session', '1')

const { data: messages } = useIDBKeyval<Record<string, ChatMessage[]>>('gemini-nano-messages', {})

const input = ref('')
const isLoading = ref(false)

const handleSelectSession = (id: string) => {
  if (activeSessionId.value !== undefined) {
    activeSessionId.value = id
    resetSession()
  }
}

const handleNewSession = () => {
  const newId = Date.now().toString()
  const newSessions = cloneDeep(sessions.value || [])
  newSessions.unshift({ id: newId, title: 'New Chat', updatedAt: Date.now() })
  sessions.value = newSessions
  
  const newMessages = cloneDeep(messages.value || {})
  newMessages[newId] = [
    { 
      id: Date.now().toString(), 
      role: 'assistant', 
      content: 'Hello! This is a new chat. How can I assist you?' 
    }
  ]
  messages.value = newMessages
  
  if (activeSessionId.value !== undefined) {
    activeSessionId.value = newId
    resetSession()
  }
}

const handleDeleteSession = (id: string) => {
  if (sessions.value) {
    sessions.value = cloneDeep(sessions.value).filter((s: ChatSession) => s.id !== id)
  }
  
  const newMessages = cloneDeep(messages.value || {})
  delete newMessages[id]
  messages.value = newMessages
  
  if (activeSessionId.value === id) {
    activeSessionId.value = (sessions.value && sessions.value.length > 0) ? sessions.value[0].id : ''
    resetSession()
  }
}

const handleRenameSession = (id: string, newTitle: string) => {
  if (!sessions.value) return
  const newSessions = cloneDeep(sessions.value)
  const session = newSessions.find((s: ChatSession) => s.id === id)
  if (session) {
    session.title = newTitle
    sessions.value = newSessions
  }
}

const handleSubmit = async () => {
  if (!input.value.trim() || isLoading.value || !activeSessionId.value || !messages.value) return
  
  const currentSessionId = activeSessionId.value
  const userText = input.value
  
  // Use a local authoritative copy to avoid race conditions with IndexedDB async writes
  let localMessages = cloneDeep(messages.value)
  if (!localMessages[currentSessionId]) {
    localMessages[currentSessionId] = []
  }
  
  localMessages[currentSessionId].push({
    id: Date.now().toString(),
    role: 'user',
    content: userText
  })
  
  const assistantMessageId = Date.now().toString() + '-ai'
  localMessages[currentSessionId].push({
    id: assistantMessageId,
    role: 'assistant',
    content: ''
  })
  
  messages.value = cloneDeep(localMessages)
  
  input.value = ''
  isLoading.value = true
  
  try {
    const stream = await promptStreaming(userText)
    
    // Hide the bouncing dots loading bubble now that the stream has connected
    isLoading.value = false
    
    let fullResponse = ''
    for await (const chunk of stream) {
      fullResponse += chunk // The chunk is just the newest piece of text, so we append
      const targetMessage = localMessages[currentSessionId].find((m: ChatMessage) => m.id === assistantMessageId)
      if (targetMessage) {
        targetMessage.content = fullResponse
      }
      messages.value = cloneDeep(localMessages)
    }
  } catch (error) {
    console.error('Failed to generate response:', error)
    const targetMessage = localMessages[currentSessionId].find((m: ChatMessage) => m.id === assistantMessageId)
    if (targetMessage) {
      targetMessage.content += '\n\n**Error:** Sorry, an error occurred while generating the response.'
    }
    messages.value = cloneDeep(localMessages)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh] p-4 md:p-8">
    <Card class="w-full max-w-5xl h-[700px] flex shadow-2xl border-primary/10 overflow-hidden bg-gradient-to-b from-background to-muted/20">
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
        <ChatMessages :messages="messages[activeSessionId] || []" :is-loading="isLoading" />

        <!-- Input Area -->
        <ChatInput v-model="input" :is-loading="isLoading" @submit="handleSubmit" />
      </div>
    </Card>
  </div>
</template>