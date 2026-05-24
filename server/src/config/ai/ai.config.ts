import { registerAs } from '@nestjs/config';
import {
  getChatDefaultModel,
  resolveEmbeddingConfig,
  resolveEmbeddingProvider,
} from '../../ai/ai-provider.factory';
import { ProviderName } from '../../ai/providers/create-provider';
import { aiSchema } from './ai.schema';

export default registerAs('ai', () => {
  const parsed = aiSchema.parse(process.env);
  const primaryProvider = parsed.AI_PROVIDER;

  const embeddingProvider = resolveEmbeddingProvider(
    primaryProvider,
    parsed.AI_EMBEDDING_PROVIDER,
  );

  const primaryEmbedding = resolveEmbeddingConfig(
    embeddingProvider,
    parsed.AI_EMBEDDING_MODEL,
    parsed.AI_EMBEDDING_DIMENSIONS,
  );

  const fallbackProvider = resolveFallbackProvider(parsed, primaryProvider);
  const fallbackApiKey = resolveFallbackApiKey(parsed, fallbackProvider);

  const fallback =
    fallbackProvider && fallbackApiKey
      ? {
          provider: fallbackProvider,
          apiKey: fallbackApiKey,
          model:
            parsed.AI_FALLBACK_MODEL ?? getChatDefaultModel(fallbackProvider),
          embeddingModel: parsed.AI_FALLBACK_EMBEDDING_MODEL,
          embeddingDimensions: parsed.AI_FALLBACK_EMBEDDING_DIMENSIONS,
        }
      : null;

  // Fallback embeddings must match primary dimensions for pgvector (default: align to primary).
  const fallbackEmbedding = fallback
    ? resolveEmbeddingConfig(
        fallback.provider,
        fallback.embeddingModel,
        fallback.embeddingDimensions ?? primaryEmbedding.dimensions,
      )
    : null;

  return {
    provider: primaryProvider,
    apiKey: parsed.AI_API_KEY,
    model: parsed.AI_MODEL ?? getChatDefaultModel(primaryProvider),
    structuredModel:
      parsed.AI_STRUCTURED_MODEL ?? getChatDefaultModel(primaryProvider),
    embeddingProvider,
    embeddingModel: primaryEmbedding.model,
    embeddingDimensions: primaryEmbedding.dimensions,
    embeddingApiKey: parsed.AI_EMBEDDING_API_KEY ?? parsed.AI_API_KEY,
    localEmbeddingUrl: parsed.LOCAL_EMBEDDING_URL,
    localEmbedding: {
      timeoutMs: parsed.LOCAL_EMBEDDING_TIMEOUT_MS,
      maxAttempts: parsed.LOCAL_EMBEDDING_MAX_RETRIES,
    },
    fallback:
      fallback && fallbackEmbedding
        ? {
            provider: fallback.provider,
            apiKey: fallback.apiKey,
            model: fallback.model,
            embeddingModel: fallbackEmbedding.model,
            embeddingDimensions: fallbackEmbedding.dimensions,
          }
        : null,
  };
});

function resolveFallbackProvider(
  parsed: ReturnType<typeof aiSchema.parse>,
  primary: ProviderName,
): ProviderName | null {
  if (parsed.AI_FALLBACK_PROVIDER) {
    return parsed.AI_FALLBACK_PROVIDER;
  }

  if (primary === 'groq' && parsed.AI_EMBEDDING_API_KEY) {
    return 'openai';
  }

  if (primary === 'openai' && parsed.AI_FALLBACK_API_KEY) {
    return 'groq';
  }

  return null;
}

function resolveFallbackApiKey(
  parsed: ReturnType<typeof aiSchema.parse>,
  fallbackProvider: ProviderName | null,
): string | undefined {
  if (!fallbackProvider) return undefined;

  if (parsed.AI_FALLBACK_API_KEY) {
    return parsed.AI_FALLBACK_API_KEY;
  }

  if (fallbackProvider === 'openai' && parsed.AI_EMBEDDING_API_KEY) {
    return parsed.AI_EMBEDDING_API_KEY;
  }

  if (fallbackProvider === 'groq') {
    return parsed.AI_API_KEY;
  }

  return undefined;
}
