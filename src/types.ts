export type MessageType = 'text' | 'image';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  timestamp: number;
  type: MessageType;
  text?: string;
  imageData?: string;
}

export interface User {
  id: string;
  username: string;
} 