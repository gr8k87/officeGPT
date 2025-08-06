// shared/types.ts
export interface User {
  id: number;
  username: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id:number;
  title: string;
  messages: Message[];
}