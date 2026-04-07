<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, Trash2, Edit2, Check, X } from 'lucide-vue-next'

export interface ChatSession {
  id: string
  title: string
  updatedAt: number
}

const props = defineProps<{
  sessions: ChatSession[]
  activeSessionId?: string
}>()

const emit = defineEmits<{
  'select': [id: string]
  'new': []
  'delete': [id: string]
  'rename': [id: string, newTitle: string]
}>()

const editingId = ref<string | null>(null)
const editTitle = ref('')
const inputRef = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

const startEdit = async (session: ChatSession) => {
  editingId.value = session.id
  editTitle.value = session.title
  await nextTick()
  if (inputRef.value) {
    const el = Array.isArray(inputRef.value) ? inputRef.value[0] : inputRef.value
    if (el && typeof el.focus === 'function') {
      el.focus()
    }
  }
}

const saveEdit = (id: string) => {
  if (editTitle.value.trim()) {
    emit('rename', id, editTitle.value.trim())
  }
  editingId.value = null
}

const cancelEdit = () => {
  editingId.value = null
}
</script>

<template>
  <div class="flex flex-col h-full w-64 border-r bg-muted/10 shrink-0">
    <!-- Sidebar Header -->
    <div class="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0 h-[73px] flex items-center">
      <Button @click="$emit('new')" class="w-full flex items-center gap-2 shadow-sm transition-transform active:scale-95">
        <Plus class="w-4 h-4" />
        New Chat
      </Button>
    </div>
    
    <!-- Sessions List -->
    <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        class="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border border-transparent"
        :class="session.id === activeSessionId ? 'bg-secondary/50 border-border/50 shadow-sm' : 'hover:bg-muted/50'"
        @click="editingId !== session.id && $emit('select', session.id)"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <MessageSquare class="w-4 h-4 shrink-0" :class="session.id === activeSessionId ? 'text-primary' : 'opacity-50'" />
          
          <!-- Edit Mode -->
          <div v-if="editingId === session.id" class="flex items-center gap-1 flex-1 min-w-0" @click.stop>
            <input 
              ref="inputRef"
              v-model="editTitle" 
              class="h-7 w-full text-sm px-2 py-1 bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" 
              @keydown.enter="saveEdit(session.id)"
              @keydown.escape="cancelEdit"
            />
            <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0 hover:bg-green-500/10 hover:text-green-600" @click="saveEdit(session.id)">
              <Check class="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0 hover:bg-red-500/10 hover:text-red-600" @click="cancelEdit">
              <X class="w-3.5 h-3.5" />
            </Button>
          </div>
          
          <!-- View Mode -->
          <span v-else class="truncate text-sm font-medium" :class="session.id === activeSessionId ? 'opacity-100' : 'opacity-80'">
            {{ session.title }}
          </span>
        </div>

        <div v-if="editingId !== session.id" class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          <Button variant="ghost" size="icon" class="h-7 w-7 hover:bg-background" @click.stop="startEdit(session)" title="Rename">
            <Edit2 class="w-3.5 h-3.5 opacity-70" />
          </Button>
          <Button variant="ghost" size="icon" class="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" @click.stop="$emit('delete', session.id)" title="Delete">
            <Trash2 class="w-3.5 h-3.5 opacity-70" />
          </Button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="sessions.length === 0" class="text-center p-4 mt-4">
        <p class="text-xs text-muted-foreground opacity-70">No chat history</p>
      </div>
    </div>
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
</style>
