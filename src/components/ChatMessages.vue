<script setup lang="ts">
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse, MessageAction, MessageActions } from '@/components/ai-elements/message'
import type { Message as ChatMessage, MessageContentItem } from '@/core/types'
import { useChatEngine } from '@/composables/useChatEngine'
import { useMessageSelection } from '@/composables/useMessageSelection'
import { TrashIcon, CheckSquareIcon, SquareIcon } from 'lucide-vue-next'

const props = defineProps<{
  messages: ChatMessage[]
  isLoading: boolean
}>()

const { deleteMessage } = useChatEngine()
const { isSelectionMode, selectedMessageIds, toggleMessageSelection } = useMessageSelection()

const handleDeleteMessage = (id: string) => {
  deleteMessage(id)
}

const isMessageEmpty = (content: MessageContentItem[]) => {
  return content.length === 0 || (content.length === 1 && content[0].type === 'text' && (content[0].value as string).trim() === '')
}

const objectUrlCache = new Map<any, string>()

const getObjectUrl = (file: any) => {
  if (!file) return ''
  if (typeof file === 'string') return file // If it's already a Data URL
  
  if (!objectUrlCache.has(file)) {
    try {
      objectUrlCache.set(file, URL.createObjectURL(file))
    } catch (e) {
      console.error('Failed to create object URL', e)
      return ''
    }
  }
  return objectUrlCache.get(file) || ''
}
</script>

<template>
  <div class="flex-1 flex flex-col relative min-h-0 h-0 w-full overflow-hidden">
    <Conversation class="flex-1 custom-scrollbar bg-transparent h-full w-full">
      <ConversationContent class="p-6">
        <div v-if="messages.length === 0">
          <ConversationEmptyState 
            title="Welcome to your AI workspace" 
            description="Type a prompt below to interact with the local LLM."
            class="py-12"
          />
        </div>
        
        <div v-else class="flex flex-col gap-6">
          <div 
            v-for="msg in messages.filter(m => !isMessageEmpty(m.content))" 
            :key="msg.id" 
            class="flex w-full group/row"
            :class="[
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              isSelectionMode ? 'cursor-pointer' : ''
            ]"
            @click="isSelectionMode ? toggleMessageSelection(msg.id) : undefined"
          >
            <!-- Selection Checkbox -->
            <div v-if="isSelectionMode" class="flex items-center justify-center shrink-0" :class="msg.role === 'user' ? 'ml-3' : 'mr-3'">
              <div class="text-muted-foreground hover:text-foreground transition-colors">
                <CheckSquareIcon v-if="selectedMessageIds.has(msg.id)" class="size-5 text-primary" />
                <SquareIcon v-else class="size-5" />
              </div>
            </div>

            <Message 
              :from="msg.role"
              class="animate-in fade-in slide-in-from-bottom-2 duration-300"
              :class="isSelectionMode ? 'pointer-events-none' : ''"
            >
              <div class="flex flex-col gap-1 max-w-full" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
                <span class="text-[10px] text-muted-foreground px-1 opacity-70">
                  {{ msg.role === 'user' ? 'You' : 'Gemini Nano' }}
                </span>
                
                <div class="flex items-center group/bubble" :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
                  
                  <MessageContent 
                    class="px-4 py-3 rounded-2xl text-sm leading-relaxed text-left shrink"
                    :class="[
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-md' 
                        : 'bg-card border shadow-sm rounded-tl-none'
                    ]"
                  >
                    <div class="flex flex-col gap-3">
                      <div v-if="msg.content.filter(i => i.type === 'image').length > 0" class="flex flex-wrap gap-2">
                        <img 
                          v-for="(img, idx) in msg.content.filter(i => i.type === 'image')" 
                          :key="'img-'+idx" 
                          :src="getObjectUrl(img.value)" 
                          class="max-w-[240px] max-h-[240px] rounded-lg object-cover shadow-sm bg-background/20" 
                        />
                      </div>
                      <div v-if="msg.content.filter(i => i.type === 'audio').length > 0" class="flex flex-col gap-2">
                         <audio 
                           v-for="(aud, idx) in msg.content.filter(i => i.type === 'audio')" 
                           :key="'aud-'+idx" 
                           controls 
                           :src="getObjectUrl(aud.value)" 
                           class="max-w-[250px] h-8 rounded-full"
                           :class="isSelectionMode ? 'pointer-events-none' : ''"
                         ></audio>
                      </div>
                      <MessageResponse 
                        v-if="msg.content.find(i => i.type === 'text') && (msg.content.find(i => i.type === 'text')?.value as string).trim()" 
                        :content="msg.content.find(i => i.type === 'text')?.value as string"
                      ></MessageResponse>
                    </div>
                  </MessageContent>

                  <!-- Single Delete Action -->
                  <div 
                    v-if="!isSelectionMode" 
                    class="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center shrink-0" 
                    :class="msg.role === 'user' ? 'mr-2' : 'ml-2'"
                  >
                    <MessageActions>
                      <MessageAction tooltip="Delete message" @click="handleDeleteMessage(msg.id)" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <TrashIcon class="size-4" />
                      </MessageAction>
                    </MessageActions>
                  </div>
                  
                </div>
              </div>
            </Message>
          </div>
          
          <Message 
            v-if="isLoading && (!messages.length || messages[messages.length - 1].role === 'user' || isMessageEmpty(messages[messages.length - 1].content))"
            from="assistant"
            class="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div class="flex flex-col gap-1 w-full items-start">
              <span class="text-[10px] text-muted-foreground px-1 opacity-70">
                Gemini Nano
              </span>
              <MessageContent class="bg-card border shadow-sm rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 h-[46px]">
                <span class="flex gap-1">
                  <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                  <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                </span>
              </MessageContent>
            </div>
          </Message>
        </div>
      </ConversationContent>
    </Conversation>
  </div>
</template>

<style scoped>
.custom-scrollbar :deep(::-webkit-scrollbar) {
  width: 5px;
}
.custom-scrollbar :deep(::-webkit-scrollbar-track) {
  background: transparent;
}
.custom-scrollbar :deep(::-webkit-scrollbar-thumb) {
  background: hsl(var(--muted-foreground) / 0.1);
  border-radius: 20px;
}
.custom-scrollbar :deep(::-webkit-scrollbar-thumb:hover) {
  background: hsl(var(--muted-foreground) / 0.2);
}
</style>