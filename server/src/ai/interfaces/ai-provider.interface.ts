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

export interface AiStructuredSchema {
  name: string;
  jsonSchema: Record<string, unknown>;
}

export interface AiStructuredGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  schema: AiStructuredSchema;
  model?: string;
}

export interface AiStructuredGenerateResult {
  content: string;
  model: string;
  provider: string;
}

export interface AiEmbeddingOptions {
  input: string | string[];
  model?: string;
  dimensions?: number;
}

export interface AiEmbeddingResult {
  embeddings: number[][];
  model: string;
  provider: string;
}

export interface AiProvider {
  readonly name: string;
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
  streamComplete(options: AiCompletionOptions): AsyncGenerator<string>;
  generateStructured(
    options: AiStructuredGenerateOptions,
  ): Promise<AiStructuredGenerateResult>;
  embed(options: AiEmbeddingOptions): Promise<AiEmbeddingResult>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
export const AI_FALLBACK_PROVIDER = Symbol('AI_FALLBACK_PROVIDER');
