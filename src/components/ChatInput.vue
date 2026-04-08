<script setup lang="ts">
import { PromptInput, PromptInputTextarea, PromptInputSubmit, PromptInputHeader, PromptInputFooter, PromptInputTools, PromptInputActionMenu, PromptInputActionMenuTrigger, PromptInputActionMenuContent, PromptInputActionAddAttachments } from '@/components/ai-elements/prompt-input'
import ChatInputAttachments from './ChatInputAttachments.vue'
import { useChatEngine } from '@/composables/useChatEngine'

defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  'submit': [message: { text: string, files: any[] }]
}>()

const { status } = useChatEngine()

const handlePromptSubmit = (message: { text: string, files: any[] }) => {
  if (status.value === 'available' && (message.text.trim() || message.files.length > 0)) {
    emit('submit', message)
  }
}
</script>

<template>
  <footer class="p-6 pt-2 border-t bg-background/50 backdrop-blur-md">
    <PromptInput
      class="relative group"
      accept="image/*,audio/*"
      multiple
      @submit="handlePromptSubmit"
    >
      <PromptInputHeader class="mb-2 flex items-center justify-between">
        <ChatInputAttachments />
      </PromptInputHeader>
      
      <PromptInputTextarea  
        :disabled="status !== 'available' || isLoading"
        :placeholder="status === 'available' ? 'Tell me something interesting...' : 'Language model is not ready. Please wait or check your browser settings.'" 
        class="min-h-[120px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 px-4 py-4 text-sm leading-relaxed placeholder:text-muted-foreground/60 resize-none no-scrollbar disabled:opacity-50"
      />

      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>

        <PromptInputSubmit 
          :disabled="status !== 'available' || isLoading"
          :status="isLoading ? 'submitted' : undefined"
          class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl size-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
        />
      </PromptInputFooter>
    </PromptInput>
  </footer>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
