import { ref, onMounted } from 'vue'

export type GeminiNanoStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'checking' | 'error'

const status = ref<GeminiNanoStatus>('checking')
const contextWindow = ref<number | null>(null)
const tokensLeft = ref<number | null>(null)
const downloadProgress = ref<number>(0)
let isChecking = false

let aiSession: any = null

export function useGeminiNano() {
  const updateTokensLeft = () => {
    if (aiSession) {
      const { contextWindow: cWindow, contextUsage } = aiSession
      tokensLeft.value = cWindow - contextUsage
    } else {
      tokensLeft.value = null
    }
  }

  const checkStatus = async () => {
    if (isChecking || (status.value !== 'checking' && status.value !== 'error')) return;
    isChecking = true;
    try {
      status.value = 'checking'
      // @ts-ignore
      if (!('LanguageModel' in window)) {
        status.value = 'unavailable'
        // TODO: give user a hint to enable the flag
        return
      }
      
      // @ts-ignore
      const availability = await window.LanguageModel.availability()
      status.value = availability as GeminiNanoStatus
      
      if (availability === 'available') {
        // @ts-ignore
        const session = await window.LanguageModel.create()
        contextWindow.value = session.contextWindow
        session.destroy()
      } else if (['downloadable', 'downloading'].includes(availability)) {
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
        session.destroy()
      }
    } catch (error) {
      console.error('Failed to check model availability:', error)
      status.value = 'error'
    } finally {
      isChecking = false;
    }
  }

  const resetSession = async (initialPrompts?: { role: string, content: string }[]) => {
    console.log('vvv');
    
    aiSession?.destroy?.()
    aiSession = null
    if (status.value !== 'available') return;
    
    try {
      // @ts-ignore
      aiSession = await window.LanguageModel.create({ initialPrompts })
      contextWindow.value = aiSession.contextWindow
      updateTokensLeft()
      
      aiSession.addEventListener('contextoverflow', () => {
        console.warn('Gemini Nano context overflowed!')
        // TODO: create a new session with compact history
        updateTokensLeft()
      })
    } catch (e) {
      console.error('Failed to create language model session:', e)
    }
  }

  const promptStreaming = async (text: string) => {
    if (!aiSession) {
      await resetSession()
    }
    
    try {
      // @ts-ignore
      const stream = aiSession.promptStreaming(text)
      
      return (async function* () {
        for await (const chunk of stream) {
          yield chunk
        }
        updateTokensLeft()
      })()
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('Context window exceeded. Creating a fresh session with compact history.')
        // TODO: create a new session with compact history
        await resetSession()
        // @ts-ignore
        const stream = aiSession.promptStreaming(text)
        return (async function* () {
          for await (const chunk of stream) {
            yield chunk
          }
          updateTokensLeft()
        })()
      }
      throw e
    }
  }

  onMounted(() => {
    checkStatus()
  })

  return {
    status,
    contextWindow,
    tokensLeft,
    downloadProgress,
    checkStatus,
    resetSession,
    promptStreaming
  }
}



