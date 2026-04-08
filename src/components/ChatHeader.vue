<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { useGeminiNano } from '@/composables/useGeminiNano'

const { status: modelStatus, downloadProgress, tokensLeft } = useGeminiNano()

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

    <div class="flex gap-2">
       <Badge variant="secondary" class="bg-primary/5 text-primary hover:bg-primary/10 transition-colors">Experimental</Badge>
    </div>
  </header>
</template>