<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import type { Message as ChatMessage } from '@/core/types'

const props = defineProps<{
  messages: ChatMessage[]
  isLoading: boolean
}>()

const scrollContainer = ref<InstanceType<typeof Conversation> | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value?.$el) {
    const el = scrollContainer.value.$el
    el.scrollTop = el.scrollHeight
  }
}

watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

watch(() => props.isLoading, () => {
  scrollToBottom()
})

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <Conversation ref="scrollContainer" class="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
    <ConversationContent class="p-6">
      <div v-if="messages.length === 0">
        <ConversationEmptyState 
          title="Welcome to your AI workspace" 
          description="Type a prompt below to interact with the local LLM."
          class="py-12"
        />
      </div>
      
      <div v-else class="flex flex-col gap-6">
        <Message 
          v-for="msg in messages.filter(m => m.content.trim() !== '')" 
          :key="msg.id"
          :from="msg.role"
          class="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="flex flex-col gap-1 w-full" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
            <span class="text-[10px] text-muted-foreground px-1 opacity-70">
              {{ msg.role === 'user' ? 'You' : 'Gemini Nano' }}
            </span>
            <MessageContent 
              class="px-4 py-3 rounded-2xl text-sm leading-relaxed text-left"
              :class="[
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md' 
                  : 'bg-card border shadow-sm rounded-tl-none'
              ]"
            >
              {{ msg.content }}
            </MessageContent>
          </div>
        </Message>
        
        <div v-if="isLoading && (!messages.length || messages[messages.length - 1].role === 'user' || messages[messages.length - 1].content.trim() === '')" class="flex items-start gap-3">
          <div class="bg-card border shadow-sm rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </span>
          </div>
        </div>
      </div>
    </ConversationContent>
  </Conversation>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.1);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.2);
}
</style>