import { ref, onMounted } from 'vue'

export type GeminiNanoStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'checking' | 'error'

const status = ref<GeminiNanoStatus>('checking')
const contextWindow = ref<number | null>(null)
const downloadProgress = ref<number>(0)
let isChecking = false

export function useGeminiNano() {
  const checkStatus = async () => {
    if (isChecking || (status.value !== 'checking' && status.value !== 'error')) return;
    isChecking = true;
    try {
      status.value = 'checking'
      // @ts-ignore
      if (!('LanguageModel' in window)) {
        status.value = 'unavailable'
        return
      }
      
      // @ts-ignore
      const availability = await window.LanguageModel.availability()
      status.value = availability as GeminiNanoStatus
      
      if (availability === 'available') {
        // @ts-ignore
        const session = await window.LanguageModel.create()
        contextWindow.value = session.contextWindow
      } else if (availability === 'downloadable' || availability === 'downloading') {
        // @ts-ignore
        const session = await window.LanguageModel.create({
          monitor(m: any) {
            m.addEventListener("downloadprogress", (e: any) => {
              downloadProgress.value = Math.round(e.loaded * 100)
              if (e.loaded === 1) {
                status.value = 'available'
              }
            })
          }
        })
        contextWindow.value = session.contextWindow
      }
    } catch (error) {
      console.error('Failed to check model availability:', error)
      status.value = 'error'
    } finally {
      isChecking = false;
    }
  }

  onMounted(() => {
    checkStatus()
  })

  return {
    status,
    contextWindow,
    downloadProgress,
    checkStatus
  }
}


