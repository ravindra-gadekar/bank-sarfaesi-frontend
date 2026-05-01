export interface BotMessage {
  id: string;
  sender: 'bot';
  type: 'question' | 'guidance' | 'computed' | 'validation' | 'summary' | 'acknowledgement';
  text: string;
  fieldKey?: string;
  timestamp: number;
}

export interface UserMessage {
  id: string;
  sender: 'user';
  text: string;
  fieldKey?: string;
  value?: unknown;
  timestamp: number;
}

export interface SystemMessage {
  id: string;
  sender: 'system';
  type: 'field-updated' | 'progress' | 'error';
  text: string;
  timestamp: number;
}

export type ChatMessage = BotMessage | UserMessage | SystemMessage;
