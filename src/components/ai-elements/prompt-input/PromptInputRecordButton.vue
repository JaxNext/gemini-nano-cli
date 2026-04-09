<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { MicIcon, SquareIcon } from 'lucide-vue-next'
import { ref, onUnmounted } from 'vue'
import { usePromptInput } from './context'
import PromptInputButton from './PromptInputButton.vue'

type PromptInputRecordButtonProps = InstanceType<typeof PromptInputButton>['$props']

interface Props extends /* @vue-ignore */ PromptInputRecordButtonProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const { addFiles } = usePromptInput()
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])

onUnmounted(() => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }
})

async function toggleRecording() {
  if (isRecording.value) {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.value = new MediaRecorder(stream)
      audioChunks.value = []

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        addFiles([audioFile])
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
        isRecording.value = false
      }

      mediaRecorder.value.start()
      isRecording.value = true
    } catch (error) {
      console.error('Error accessing microphone:', error)
      isRecording.value = false
    }
  }
}
</script>

<template>
  <PromptInputButton
    :class="cn(
      'relative transition-all duration-200',
      isRecording && 'animate-pulse bg-destructive text-destructive-foreground hover:bg-destructive/90',
      props.class,
    )"
    v-bind="props"
    @click="toggleRecording"
  >
    <SquareIcon v-if="isRecording" class="size-4" />
    <MicIcon v-else class="size-4" />
  </PromptInputButton>
</template>
