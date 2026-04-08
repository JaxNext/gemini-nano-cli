import { get, set, del } from 'idb-keyval';
import type { Session, Message } from './types';
import { cloneDeep } from 'lodash-es';

export class StorageProvider {
  private readonly SESSIONS_KEY = 'gemini-nano-sessions';
  private readonly ACTIVE_SESSION_KEY = 'gemini-nano-active-session';
  private readonly MESSAGES_PREFIX = 'gemini-nano-messages-';

  async getSessions(): Promise<Session[]> {
    return (await get(this.SESSIONS_KEY)) || [];
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    await set(this.SESSIONS_KEY, cloneDeep(sessions));
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    await this.saveSessions(updatedSessions);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return (await get(`${this.MESSAGES_PREFIX}${sessionId}`)) || [];
  }

  async saveMessages(sessionId: string, messages: Message[]): Promise<void> {
    await set(`${this.MESSAGES_PREFIX}${sessionId}`, cloneDeep(messages));
  }

  async deleteMessages(sessionId: string): Promise<void> {
    await del(`${this.MESSAGES_PREFIX}${sessionId}`);
  }

  async getActiveSessionId(): Promise<string | undefined> {
    return await get(this.ACTIVE_SESSION_KEY);
  }

  async setActiveSessionId(sessionId: string): Promise<void> {
    await set(this.ACTIVE_SESSION_KEY, sessionId);
  }
}
