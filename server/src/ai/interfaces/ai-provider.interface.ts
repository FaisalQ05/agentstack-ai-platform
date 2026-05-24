export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  messages: AiChatMessage[];
  model?: string;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  provider: string;
}

export interface AiProvider {
  readonly name: string;
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
