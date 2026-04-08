import mitt from 'mitt';
import type { Emitter } from 'mitt';
import { StorageProvider } from './StorageProvider';
import { GeminiClient } from './GeminiClient';
import type { Message, Session, GeminiNanoStatus } from './types';

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

    // Initialize the AI session with message history
    const initialPrompts = this.messages
      .filter(m => m.content) // Only include non-empty messages
      .map(m => ({
        role: m.role,
        content: m.content
      }));
    await this.aiClient.resetSession(initialPrompts);
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
        content: 'Hello! This is a new chat. How can I assist you?' 
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

  async sendMessage(content: string) {
    if (!this.activeSessionId || this.isGenerating) return;

    this.isGenerating = true;
    this.emitter.emit('generation:start');

    // Add user message
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    this.messages = [...this.messages, userMessage];
    this.emitter.emit('messages:changed', this.messages);

    // Create assistant message placeholder
    const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
    this.messages = [...this.messages, assistantMessage];
    this.emitter.emit('messages:changed', this.messages);

    try {
      this.abortController = new AbortController();
      const stream = await this.aiClient.promptStreaming(content);
      
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
        assistantMessage.content = fullText;
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
        assistantMessage.content += '\n\n**[Error]** Failed to generate response.';
        this.emitter.emit('messages:changed', [...this.messages]);
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
