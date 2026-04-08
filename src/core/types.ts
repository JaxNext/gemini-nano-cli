export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
}

export type GeminiNanoStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'checking' | 'error';
