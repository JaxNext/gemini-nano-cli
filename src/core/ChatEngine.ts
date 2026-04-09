import mitt from 'mitt';
import type { Emitter } from 'mitt';
import { StorageProvider } from './StorageProvider';
import { GeminiClient } from './GeminiClient';
import type { Message, Session, GeminiNanoStatus, MessageContentItem } from './types';

export type ChatEngineEvents = {
  'sessions:changed': Session[];
  'activeSession:changed': string | undefined;
  'messages:changed': Message[];
  'generation:start': void;
  'generation:chunk': { chunk: string; fullText: string };
  'generation:end': void;
  'error': Error;
  'status:changed': GeminiNanoStatus;
  'downloadProgress:changed': number;
  'tokensLeft:changed': number | null;
};

export class ChatEngine {
  private storage: StorageProvider;
  private aiClient: GeminiClient;
  private emitter: Emitter<ChatEngineEvents>;

  public activeSessionId?: string;
  public messages: Message[] = [];
  public sessions: Session[] = [];
  public isGenerating: boolean = false;
  public status: GeminiNanoStatus = 'checking';
  public downloadProgress: number = 0;
  public tokensLeft: number | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.storage = new StorageProvider();
    this.aiClient = new GeminiClient();
    this.emitter = mitt<ChatEngineEvents>();
  }

  on<Key extends keyof ChatEngineEvents>(type: Key, handler: (event: ChatEngineEvents[Key]) => void) {
    this.emitter.on(type, handler);
  }

  off<Key extends keyof ChatEngineEvents>(type: Key, handler: (event: ChatEngineEvents[Key]) => void) {
    this.emitter.off(type, handler);
  }

  async initialize() {
    // Load sessions
    this.sessions = await this.storage.getSessions();
    this.emitter.emit('sessions:changed', this.sessions);

    // Load active session
    const activeId = await this.storage.getActiveSessionId();
    if (activeId && this.sessions.some(s => s.id === activeId)) {
      await this.loadSession(activeId);
    } else if (this.sessions.length > 0) {
      await this.loadSession(this.sessions[0].id);
    } else {
      await this.createNewSession();
    }

    // Check AI availability
    this.status = await this.aiClient.checkAvailability((progress) => {
      this.downloadProgress = progress;
      this.emitter.emit('downloadProgress:changed', progress);
      if (progress >= 100) {
        this.status = 'available';
        this.emitter.emit('status:changed', this.status);
      }
    });
    this.emitter.emit('status:changed', this.status);
    
    this.updateTokensLeft();
  }

  private updateTokensLeft() {
    this.tokensLeft = this.aiClient.getTokensLeft();
    this.emitter.emit('tokensLeft:changed', this.tokensLeft);
  }

  async loadSession(id: string) {
    this.activeSessionId = id;
    await this.storage.setActiveSessionId(id);
    this.emitter.emit('activeSession:changed', id);

    this.messages = await this.storage.getMessages(id);
    this.emitter.emit('messages:changed', this.messages);

    await this.aiClient.resetSession();
    this.updateTokensLeft();
  }

  async createNewSession() {
    const newId = Date.now().toString();
    const newSession: Session = { id: newId, title: 'New Chat', updatedAt: Date.now() };
    
    this.sessions = [newSession, ...this.sessions];
    await this.storage.saveSessions(this.sessions);
    this.emitter.emit('sessions:changed', this.sessions);

    const initMessages: Message[] = [
      { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: [{ type: 'text', value: 'Hello! This is a new chat. How can I assist you?' }]
      }
    ];
    await this.storage.saveMessages(newId, initMessages);

    await this.loadSession(newId);
    return newId;
  }

  async deleteSession(id: string) {
    await this.storage.deleteSession(id);
    await this.storage.deleteMessages(id);
    
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.emitter.emit('sessions:changed', this.sessions);

    if (this.activeSessionId === id) {
      if (this.sessions.length > 0) {
        await this.loadSession(this.sessions[0].id);
      } else {
        this.activeSessionId = undefined;
        await this.storage.setActiveSessionId('');
        this.messages = [];
        this.emitter.emit('activeSession:changed', undefined);
        this.emitter.emit('messages:changed', this.messages);
      }
    }
  }

  async renameSession(id: string, title: string) {
    const session = this.sessions.find(s => s.id === id);
    if (session) {
      session.title = title;
      await this.storage.saveSessions(this.sessions);
      this.emitter.emit('sessions:changed', this.sessions);
    }
  }

  async deleteMessage(messageId: string) {
    if (!this.activeSessionId) return;
    this.messages = this.messages.filter(m => m.id !== messageId);
    this.emitter.emit('messages:changed', this.messages);
    await this.storage.saveMessages(this.activeSessionId, this.messages);
  }

  async deleteMessages(messageIds: string[]) {
    if (!this.activeSessionId || messageIds.length === 0) return;
    this.messages = this.messages.filter(m => !messageIds.includes(m.id));
    this.emitter.emit('messages:changed', this.messages);
    await this.storage.saveMessages(this.activeSessionId, this.messages);
  }

  async sendMessage(text: string, files: any[] = []) {
    if (!this.activeSessionId || this.isGenerating) return;

    this.isGenerating = true;
    this.emitter.emit('generation:start');

    const promptContent: MessageContentItem[] = [];
    
    if (text.trim()) {
      promptContent.push({ type: 'text', value: text });
    }
    
    if (files?.length) {
      for (const file of files) {
        const nativeFile = file.file || file;
        const typePrefix = nativeFile.type ? nativeFile.type.split('/')[0] : '';
        
        if (typePrefix === 'image') {
          promptContent.push({ type: 'image', value: nativeFile });
        } else if (typePrefix === 'audio') {
          promptContent.push({ type: 'audio', value: nativeFile });
        }
      }
    }

    // Add user message
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: promptContent };
    this.messages = [...this.messages, userMessage];

    // Create assistant message placeholder
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: [{ type: 'text', value: '' }] };
    this.messages = [...this.messages, assistantMessage];
    
    this.emitter.emit('messages:changed', this.messages);
    
    // Save immediately so user message is persisted even if AI throws error
    try {
      await this.storage.saveMessages(this.activeSessionId, this.messages);
    } catch (e) {
      console.error('Failed to save message to IndexedDB:', e);
    }

    try {
      this.abortController = new AbortController();
      
      // Pass the same content format to the prompt API
      const stream = await this.aiClient.promptStreaming([{
        role: 'user',
        content: promptContent
      }]);
      
      if (!stream) {
        throw new Error('Failed to start streaming');
      }

      let fullText = '';
      for await (const chunk of stream) {
        if (this.abortController.signal.aborted) {
          break;
        }
        // window.LanguageModel API normally returns accumulated chunks
        fullText += typeof chunk === 'string' ? chunk : (chunk as any).text || chunk; 
        assistantMessage.content[0].value = fullText;
        this.emitter.emit('messages:changed', [...this.messages]);
        this.emitter.emit('generation:chunk', { chunk: fullText, fullText });
      }

      // Save messages after generation
      await this.storage.saveMessages(this.activeSessionId, this.messages);
      
      // Update session timestamp
      const session = this.sessions.find(s => s.id === this.activeSessionId);
      if (session) {
        session.updatedAt = Date.now();
        await this.storage.saveSessions(this.sessions);
        this.emitter.emit('sessions:changed', this.sessions);
      }

      this.updateTokensLeft();

    } catch (error) {
      console.error('Error generating message:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        this.emitter.emit('error', error);
        assistantMessage.content[0].value += '\n\n**[Error]** Failed to generate response. (Does your browser support Multimodal Gemini Nano?)';
        this.emitter.emit('messages:changed', [...this.messages]);
        
        // Save the error state to DB
        try {
          if (this.activeSessionId) {
            await this.storage.saveMessages(this.activeSessionId, this.messages);
          }
        } catch (e) {}
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
      this.emitter.emit('generation:end');
    }
  }

  abortGeneration() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
