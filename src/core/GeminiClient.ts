import type { GeminiNanoStatus, MessageContentItem } from './types';

interface PromptItem {
  role: 'user' | 'assistant';
  content: MessageContentItem[];
}

export class GeminiClient {
  private aiSession: any = null;

  async checkAvailability(onProgress?: (progress: number) => void): Promise<GeminiNanoStatus> {
    // @ts-ignore
    if (!('LanguageModel' in window)) {
      return 'unavailable';
    }
    
    // @ts-ignore
    const availability = await window.LanguageModel.availability();
    
    if (availability === 'available') {
      return 'available';
    } else if (['downloadable', 'downloading'].includes(availability)) {
      try {
        // @ts-ignore
        const session = await window.LanguageModel.create({
          monitor(m: any) {
            m.addEventListener("downloadprogress", (e: any) => {
              if (onProgress) onProgress(Math.round(e.loaded * 100));
            });
          }
        });
        session.destroy();
        return 'available';
      } catch (e) {
        console.error('Failed to download model:', e);
        return 'error';
      }
    }
    return availability as GeminiNanoStatus;
  }

  async resetSession(initialPrompts?: PromptItem[]): Promise<void> {
    this.aiSession?.destroy?.();
    this.aiSession = null;
    
    try {
      const options: any = { initialPrompts };
      
      options.expectedInputs = [
        {
          type: 'text'
        },
        {
          type: 'image'
        },
        {
          type: 'audio'
        }
      ]

      // @ts-ignore
      this.aiSession = await window.LanguageModel.create(options);
      
      this.aiSession.addEventListener('contextoverflow', () => {
        console.warn('Gemini Nano context overflowed!');
        // Context overflow event handling
      });
    } catch (e) {
      console.error('Failed to create language model session:', e);
      throw e;
    }
  }

  getContextWindow(): number | null {
    return this.aiSession?.contextWindow || null;
  }

  getTokensLeft(): number | null {
    if (this.aiSession) {
      return this.aiSession.contextWindow - this.aiSession.contextUsage;
    }
    return null;
  }

  async promptStreaming(input: PromptItem[]): Promise<AsyncGenerator<string> | null> {
    if (!this.aiSession) {
      await this.resetSession();
    }
    
    if (!this.aiSession) {
      return null;
    }
    
    // @ts-ignore
    return this.aiSession.promptStreaming(input);
  }
}
