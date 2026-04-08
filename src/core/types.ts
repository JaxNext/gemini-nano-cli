export interface MessageContentItem {
  type: 'text' | 'image' | 'audio';
  value: string | Blob | ArrayBuffer | any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: MessageContentItem[];
}

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
}

export type GeminiNanoStatus = 'available' | 'downloadable' | 'downloading' | 'unavailable' | 'checking' | 'error';
