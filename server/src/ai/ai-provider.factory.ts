import { TypedConfigService } from '../config/typed-config.service';
import { AiProvider } from './interfaces/ai-provider.interface';
import { CompositeAiProvider } from './providers/composite.provider';
import {
  createAiProvider,
  ProviderEmbeddingConfig,
  ProviderName,
} from './providers/create-provider';

const CHAT_DEFAULTS = {
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
} as const;

/** Groq does not expose production embedding models — use OpenAI for vectors. */
const EMBEDDING_DEFAULTS: Record<ProviderName, ProviderEmbeddingConfig> = {
  openai: { model: 'text-embedding-3-small', dimensions: 768 },
  groq: { model: 'text-embedding-3-small', dimensions: 768 },
};

export function resolveEmbeddingConfig(
  provider: ProviderName,
  modelOverride?: string,
  dimensionsOverride?: number,
): ProviderEmbeddingConfig {
  const defaults = EMBEDDING_DEFAULTS[provider];
  return {
    model: modelOverride ?? defaults.model,
    dimensions: dimensionsOverride ?? defaults.dimensions,
  };
}

export function resolveEmbeddingProvider(
  primary: ProviderName,
  override?: ProviderName,
): ProviderName {
  if (override) return override;
  return primary === 'groq' ? 'openai' : primary;
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
    name: embeddingProvider,
    apiKey: embedKey,
    chatModel: getChatDefaultModel(embeddingProvider),
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
