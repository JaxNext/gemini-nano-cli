<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useChatEngine } from '@/composables/useChatEngine'
import { useMessageSelection } from '@/composables/useMessageSelection'
import { TrashIcon, ListChecksIcon, XIcon } from 'lucide-vue-next'

const { status: modelStatus, downloadProgress, tokensLeft, deleteMessages } = useChatEngine()
const { isSelectionMode, selectedMessageIds, toggleSelectionMode, clearSelection } = useMessageSelection()

const handleDeleteSelected = () => {
  if (selectedMessageIds.value.size > 0) {
    deleteMessages(Array.from(selectedMessageIds.value))
    clearSelection()
  }
}


const getStatusColor = (status: string) => {
  switch (status) {
    case 'available': return 'bg-green-500'
    case 'downloadable': return 'bg-yellow-500'
    case 'downloading': return 'bg-blue-500'
    case 'unavailable': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusText = (status: string, progress?: number) => {
  switch (status) {
    case 'available': return 'Ready'
    case 'downloadable': 
    case 'downloading': return `Downloading... ${progress || 0}%`
    case 'unavailable': return 'Not Supported'
    case 'checking': return 'Checking...'
    default: return 'Error'
  }
}
</script>

<template>
  <header class="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
    <div class="flex items-center gap-3">
      <div class="relative">
        <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-inner">
          <span class="text-primary-foreground font-bold text-lg">G</span>
        </div>
        <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background transition-colors duration-300" :class="getStatusColor(modelStatus)"></div>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold tracking-tight">Gemini Nano</h1>
          <Badge variant="outline" class="text-[10px] uppercase font-bold py-0 h-4 border-primary/30 text-primary">Local</Badge>
        </div>
        <p class="text-xs text-muted-foreground font-medium flex items-center gap-1">
           AI-native assistant &bull; {{ getStatusText(modelStatus, downloadProgress) }}
           <span v-if="tokensLeft" class="opacity-70">&bull; {{ tokensLeft }} tokens left</span>
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
       <div v-if="isSelectionMode" class="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50 animate-in fade-in zoom-in-95 duration-200">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2 mr-1">{{ selectedMessageIds.size }} Selected</span>
          <Button size="sm" variant="destructive" class="rounded-md h-7 px-3 text-xs font-bold shadow-sm shadow-destructive/20 text-black" :disabled="selectedMessageIds.size === 0" @click="handleDeleteSelected">
            <TrashIcon class="size-3.5 mr-1 text-black" /> Delete
          </Button>
          <Button size="sm" variant="ghost" class="rounded-md h-7 px-2 text-xs" @click="clearSelection">
            <XIcon class="size-3.5" />
          </Button>
       </div>
       <Button v-else size="sm" variant="ghost" @click="toggleSelectionMode" class="rounded-lg h-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
          <ListChecksIcon class="size-4 mr-2" />
          <span class="text-xs font-bold uppercase tracking-tight">Select</span>
       </Button>
       <div class="w-[1px] h-4 bg-border/50 mx-1"></div>
       <Badge variant="secondary" class="bg-primary/5 text-primary hover:bg-primary/10 transition-colors">Experimental</Badge>
    </div>
  </header>
</template>