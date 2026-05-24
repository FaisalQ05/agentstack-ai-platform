import { TypedConfigService } from '../config/typed-config.service';
import { AiProvider } from './interfaces/ai-provider.interface';
import { CompositeAiProvider } from './providers/composite.provider';
import {
  createAiProvider,
  ProviderEmbeddingConfig,
  ProviderName,
} from './providers/create-provider';

export type EmbeddingProviderName = 'local' | ProviderName;

const CHAT_DEFAULTS = {
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
} as const;

const LOCAL_EMBEDDING_DEFAULTS: ProviderEmbeddingConfig = {
  model: 'all-MiniLM-L6-v2',
  dimensions: 384,
};

/** Cloud embeddings align to local MiniLM dimensions for pgvector. */
const EMBEDDING_DEFAULTS: Record<ProviderName, ProviderEmbeddingConfig> = {
  openai: { model: 'text-embedding-3-small', dimensions: 384 },
  groq: { model: 'text-embedding-3-small', dimensions: 384 },
};

export function resolveEmbeddingConfig(
  provider: EmbeddingProviderName,
  modelOverride?: string,
  dimensionsOverride?: number,
): ProviderEmbeddingConfig {
  if (provider === 'local') {
    return {
      model: modelOverride ?? LOCAL_EMBEDDING_DEFAULTS.model,
      dimensions: dimensionsOverride ?? LOCAL_EMBEDDING_DEFAULTS.dimensions,
    };
  }

  const defaults = EMBEDDING_DEFAULTS[provider];
  return {
    model: modelOverride ?? defaults.model,
    dimensions: dimensionsOverride ?? defaults.dimensions,
  };
}

export function resolveEmbeddingProvider(
  primary: ProviderName,
  override?: EmbeddingProviderName,
): EmbeddingProviderName {
  if (override) return override;
  return 'local';
}

export function buildPrimaryProvider(config: TypedConfigService): AiProvider {
  const {
    provider: chatProvider,
    apiKey,
    model,
    embeddingProvider,
    embeddingModel,
    embeddingDimensions,
    embeddingApiKey,
  } = config.ai;

  /** RAG vectors use EmbeddingGeneratorService (local → openai → groq). */
  if (embeddingProvider === 'local') {
    return createAiProvider({
      name: chatProvider,
      apiKey,
      chatModel: model,
      embedding: resolveEmbeddingConfig(chatProvider),
    });
  }

  const chat = createAiProvider({
    name: chatProvider,
    apiKey,
    chatModel: model,
    embedding: resolveEmbeddingConfig(chatProvider),
  });

  if (embeddingProvider === chatProvider) {
    return createAiProvider({
      name: chatProvider,
      apiKey,
      chatModel: model,
      embedding: resolveEmbeddingConfig(
        chatProvider,
        embeddingModel,
        embeddingDimensions,
      ),
    });
  }

  const embedKey =
    embeddingProvider === 'openai' ? embeddingApiKey : apiKey;

  const embed = createAiProvider({
    name: embeddingProvider as ProviderName,
    apiKey: embedKey,
    chatModel: getChatDefaultModel(embeddingProvider as ProviderName),
    embedding: resolveEmbeddingConfig(
      embeddingProvider,
      embeddingModel,
      embeddingDimensions,
    ),
  });

  return new CompositeAiProvider(chat, embed);
}

export function buildFallbackProvider(
  config: TypedConfigService,
): AiProvider | null {
  const fallback = config.ai.fallback;
  if (!fallback?.apiKey) return null;

  return createAiProvider({
    name: fallback.provider,
    apiKey: fallback.apiKey,
    chatModel: fallback.model,
    embedding: resolveEmbeddingConfig(
      fallback.provider,
      fallback.embeddingModel,
      fallback.embeddingDimensions,
    ),
  });
}

export function getChatDefaultModel(provider: ProviderName): string {
  return CHAT_DEFAULTS[provider];
}
