import OpenAI from 'openai';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { GroqProvider } from './groq.provider';
import { OpenAiProvider } from './openai.provider';

export type ProviderName = 'openai' | 'groq';

export interface ProviderEmbeddingConfig {
  model: string;
  dimensions: number;
}

export interface CreateProviderOptions {
  name: ProviderName;
  apiKey: string;
  chatModel: string;
  embedding: ProviderEmbeddingConfig;
}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export function createAiProvider(options: CreateProviderOptions): AiProvider {
  const { name, apiKey, chatModel, embedding } = options;

  if (name === 'groq') {
    const client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
    return new GroqProvider(
      client,
      chatModel,
      embedding.model,
      embedding.dimensions,
    );
  }

  const client = new OpenAI({ apiKey });
  return new OpenAiProvider(
    client,
    chatModel,
    embedding.model,
    embedding.dimensions,
  );
}
