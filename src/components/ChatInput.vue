<script setup lang="ts">
import { PromptInput, PromptInputTextarea, PromptInputSubmit, PromptInputHeader } from '@/components/ai-elements/prompt-input'
import { useChatEngine } from '@/composables/useChatEngine'

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  'submit': []
}>()

const model = defineModel<string>()
const { status } = useChatEngine()

const handleSubmit = () => {
  if (status.value === 'available') {
    emit('submit')
  }
}
</script>

<template>
  <footer class="p-6 pt-2 border-t bg-background/50 backdrop-blur-md">
    <PromptInput
      class="relative group"
    >
      <PromptInputHeader class="mb-2 flex items-center justify-between">
        <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-1">Message Input</span>
      </PromptInputHeader>
      
        <PromptInputTextarea  
          v-model="model"
          :disabled="status !== 'available' || isLoading"
          :placeholder="status === 'available' ? 'Tell me something interesting...' : 'Language model is not ready. Please wait or check your browser settings.'" 
          class="min-h-[120px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 px-4 py-4 text-sm leading-relaxed placeholder:text-muted-foreground/60 resize-none no-scrollbar disabled:opacity-50"
          @keydown.enter.prevent="handleSubmit"
        />
        
        <div class="absolute bottom-3 right-3 flex items-center gap-2">
          <div v-if="status === 'available'" class="text-[10px] text-muted-foreground mr-2 font-mono bg-muted/50 px-2 py-0.5 rounded border">
            ENTER to send
          </div>
          <PromptInputSubmit 
            @click="handleSubmit"
            :disabled="status !== 'available' || isLoading || !model"
            :status="isLoading ? 'submitted' : undefined"
            class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl size-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
          />
        </div>
    </PromptInput>
  </footer>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>