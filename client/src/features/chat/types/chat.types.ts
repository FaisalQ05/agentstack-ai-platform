export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  system?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  provider: string;
  model: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  systemPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}
