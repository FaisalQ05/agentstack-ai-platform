import OpenAI from 'openai';
import {
  AiEmbeddingOptions,
  AiEmbeddingResult,
} from '../interfaces/ai-provider.interface';

export async function executeEmbedding(
  client: OpenAI,
  providerName: string,
  defaultModel: string,
  defaultDimensions: number,
  options: AiEmbeddingOptions,
): Promise<AiEmbeddingResult> {
  const input = options.input;
  const model = options.model ?? defaultModel;
  const dimensions = options.dimensions ?? defaultDimensions;

  // Groq (nomic-embed) uses fixed model dimensions; OpenAI supports `dimensions`.
  const response = await client.embeddings.create({
    model,
    input,
    ...(providerName === 'openai' ? { dimensions } : {}),
  });

  const embeddings = response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);

  return {
    embeddings,
    model: response.model,
    provider: providerName,
  };
}
