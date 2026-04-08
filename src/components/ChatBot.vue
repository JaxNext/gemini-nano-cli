<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { get, set, del } from 'idb-keyval'
import { useGeminiNano } from '@/composables/useGeminiNano'
import ChatHeader from './ChatHeader.vue'
import ChatMessages, { type ChatMessage } from './ChatMessages.vue'
import ChatInput from './ChatInput.vue'
import ChatSidebar, { type ChatSession } from './ChatSidebar.vue'
import { cloneDeep } from 'lodash-es'

const { promptStreaming, resetSession } = useGeminiNano()

// Persist state in IndexedDB
const { data: sessions, isFinished: isSessionsLoaded } = useIDBKeyval<ChatSession[]>('gemini-nano-sessions', [])
const { data: activeSessionId, isFinished: isActiveSessionLoaded } = useIDBKeyval<string>('gemini-nano-active-session', '')

const currentMessages = ref<ChatMessage[]>([])
const input = ref('')
const isLoading = ref(false)

watch(activeSessionId, async (newId) => {
  if (newId) {
    const loaded = await get(`gemini-nano-messages-${newId}`)
    currentMessages.value = loaded || []
  } else {
    currentMessages.value = []
  }
}, { immediate: true })

const saveMessages = async (id: string, msgs: ChatMessage[]) => {
  await set(`gemini-nano-messages-${id}`, cloneDeep(msgs))
}

const deleteMessages = async (id: string) => {
  await del(`gemini-nano-messages-${id}`)
}

const handleSelectSession = (id: string) => {
  activeSessionId.value = id
  resetSession()
}

const handleNewSession = async () => {
  const newId = Date.now().toString()
  const newSessions = cloneDeep(sessions.value || [])
  newSessions.unshift({ id: newId, title: 'New Chat', updatedAt: Date.now() })
  sessions.value = newSessions
  
  const initMessages = [
    { 
      id: Date.now().toString(), 
      role: 'assistant', 
      content: 'Hello! This is a new chat. How can I assist you?' 
    }
  ]
  await saveMessages(newId, initMessages)
  
  activeSessionId.value = newId
  resetSession()
}

watch([isSessionsLoaded, isActiveSessionLoaded], async ([sLoaded, aLoaded]) => {
  if (sLoaded && aLoaded) {
    if (!sessions.value || sessions.value.length === 0) {
      await handleNewSession()
    } else if (!activeSessionId.value && sessions.value.length > 0) {
      activeSessionId.value = sessions.value[0].id
      resetSession()
    }
  }
}, { immediate: true })

const handleDeleteSession = async (id: string) => {
  if (sessions.value) {
    sessions.value = cloneDeep(sessions.value).filter((s: ChatSession) => s.id !== id)
  }
  
  await deleteMessages(id)
  
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
  if (!input.value.trim() || isLoading.value || !activeSessionId.value) return
  
  const currentSessionId = activeSessionId.value
  const userText = input.value
  
  currentMessages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: userText
  })
  
  const assistantMessageId = Date.now().toString() + '-ai'
  currentMessages.value.push({
    id: assistantMessageId,
    role: 'assistant',
    content: ''
  })
  
  saveMessages(currentSessionId, currentMessages.value)
  
  input.value = ''
  isLoading.value = true
  
  try {
    const stream = await promptStreaming(userText)
    
    // Hide the bouncing dots loading bubble now that the stream has connected
    isLoading.value = false
    
    let fullResponse = ''
    for await (const chunk of stream) {
      fullResponse += chunk // The chunk is just the newest piece of text, so we append
      const targetMessage = currentMessages.value.find((m: ChatMessage) => m.id === assistantMessageId)
      if (targetMessage) {
        targetMessage.content = fullResponse
      }
      saveMessages(currentSessionId, currentMessages.value)
    }
  } catch (error) {
    console.error('Failed to generate response:', error)
    const targetMessage = currentMessages.value.find((m: ChatMessage) => m.id === assistantMessageId)
    if (targetMessage) {
      targetMessage.content += '\n\n**Error:** Sorry, an error occurred while generating the response.'
    }
    saveMessages(currentSessionId, currentMessages.value)
  } finally {
    isLoading.value = false
  }
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
      <ChatMessages :messages="currentMessages" :is-loading="isLoading" />

      <!-- Input Area -->
      <ChatInput v-model="input" :is-loading="isLoading" @submit="handleSubmit" />
    </div>
  </div>
</template>
