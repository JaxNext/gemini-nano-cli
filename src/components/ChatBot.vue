<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { PromptInput, PromptInputTextarea, PromptInputSubmit, PromptInputHeader } from '@/components/ai-elements/prompt-input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<ChatMessage[]>([
  { 
    id: '1', 
    role: 'assistant', 
    content: 'Welcome to the Gemini Nano sandbox! I am running locally in your browser. How can I help you today?' 
  },
])

const input = ref('')
const isLoading = ref(false)
const scrollContainer = ref<InstanceType<typeof Conversation> | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (scrollContainer.value?.$el) {
    const el = scrollContainer.value.$el
    el.scrollTop = el.scrollHeight
  }
}

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
  await scrollToBottom()
  
  // Simulated AI response
  setTimeout(async () => {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `That's an interesting question about "${userText}". Since I'm a local model, I can respond quickly without any API calls! How else can I assist?`
    })
    isLoading.value = false
    await scrollToBottom()
  }, 1000)
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh] p-4 md:p-8">
    <Card class="w-full max-w-4xl h-[700px] flex flex-col shadow-2xl border-primary/10 overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <!-- Chat Header -->
      <header class="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-inner">
              <span class="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-bold tracking-tight">Gemini Nano</h1>
              <Badge variant="outline" class="text-[10px] uppercase font-bold py-0 h-4 border-primary/30 text-primary">Local</Badge>
            </div>
            <p class="text-xs text-muted-foreground font-medium flex items-center gap-1">
               AI-native assistant
            </p>
          </div>
        </div>
        
        <div class="flex gap-2">
           <Badge variant="secondary" class="bg-primary/5 text-primary hover:bg-primary/10 transition-colors">Experimental</Badge>
        </div>
      </header>

      <!-- Messages Area -->
      <Conversation ref="scrollContainer" class="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
        <ConversationContent class="p-6">
          <div v-if="messages.length === 0">
            <ConversationEmptyState 
              title="Welcome to your AI workspace" 
              description="Type a prompt below to interact with the local LLM."
              class="py-12"
            />
          </div>
          
          <div v-else class="flex flex-col gap-6 max-w-3xl mx-auto">
            <Message 
              v-for="msg in messages" 
              :key="msg.id"
              :from="msg.role"
              class="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div class="flex flex-col gap-1 w-full" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
                <span class="text-[10px] text-muted-foreground px-1 opacity-70">
                  {{ msg.role === 'user' ? 'You' : 'Gemini Nano' }}
                </span>
                <MessageContent 
                  class="px-4 py-3 rounded-2xl text-sm leading-relaxed"
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
            
            <div v-if="isLoading" class="flex items-start gap-3">
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

      <!-- Input Area -->
      <footer class="p-6 pt-2 border-t bg-background/50 backdrop-blur-md">
        <PromptInput
          class="relative group"
        >
          <PromptInputHeader class="mb-2 flex items-center justify-between">
            <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Message Input</span>
          </PromptInputHeader>
          
            <PromptInputTextarea  
              v-model="input"
              placeholder="Tell me something interesting..." 
              class="min-h-[120px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 px-4 py-4 text-sm leading-relaxed placeholder:text-muted-foreground/60 resize-none no-scrollbar"
              @keydown.enter.prevent="handleSubmit"
            />
            
            <div class="absolute bottom-3 right-3 flex items-center gap-2">
              <div class="text-[10px] text-muted-foreground mr-2 font-mono bg-muted/50 px-2 py-0.5 rounded border">
                ENTER to send
              </div>
              <PromptInputSubmit 
                :status="isLoading ? 'submitted' : undefined"
                class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl size-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              />
            </div>
        </PromptInput>
      </footer>
    </Card>
  </div>
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
