import type { GeminiNanoStatus, MessageContentItem } from './types';

interface PromptItem {
  role: 'user' | 'assistant' | 'system';
  content: MessageContentItem[];
}

export class GeminiClient {
  private aiSession: any = null;
  private initialPrompts: PromptItem[] = [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          value: 'You are a helpful assistant. You can use tools to help the user.'
        }
      ]
        
    }
  ];
  private expectedInputs: any[] = [
    {
      type: 'text'
    },
    {
      type: 'image'
    },
    {
      type: 'audio'
    },
    // {
    //   type: 'tool-response'
    // }
  ];
  private expectedOutputs: any[] = [
    {
      type: 'text'
    },
    // {
    //   type: 'tool-call'
    // }
  ];
  private tools: any[] = [
    {
      name: 'getJaxInfo',
      description: 'Get information about Jax',
      inputSchema: {
        // type: 'object',
        // properties: {
        //   location: {
        //     type: 'string',
        //     description: 'The city to check for the weather condition.'
        //   }
        // },
        // required: ['location']
      },
      execute: () => {
        return JSON.stringify({
          name: 'Jax',
          birthDate: '1990-01-01',
          gender: 'male',
          job: 'engineer',
          hobbies: ['reading', 'coding', 'gaming']
        })
      }
    }
  ];

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

  // TODO: support compact history load in session
  async resetSession(): Promise<void> {
    this.aiSession?.destroy?.();
    this.aiSession = null;
    
    try {
      // @ts-ignore
      this.aiSession = await window.LanguageModel.create({
        initialPrompts: this.initialPrompts,
        expectedInputs: this.expectedInputs,
        expectedOutputs: this.expectedOutputs,
        tools: this.tools
      });
      
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
