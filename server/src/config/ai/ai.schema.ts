import { z } from 'zod';

const providerEnum = z.enum(['openai', 'groq']);
const embeddingProviderEnum = z.enum(['local', 'openai', 'groq']);

export const aiSchema = z.object({
  AI_PROVIDER: providerEnum.default('openai'),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().optional(),
  AI_STRUCTURED_MODEL: z.string().optional(),
  AI_EMBEDDING_PROVIDER: embeddingProviderEnum.optional(),
  AI_EMBEDDING_MODEL: z.string().optional(),
  AI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().optional(),
  LOCAL_EMBEDDING_URL: z.string().url().default('http://localhost:8000'),
  LOCAL_EMBEDDING_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  LOCAL_EMBEDDING_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  /** OpenAI key used when primary is groq and fallback is openai */
  AI_EMBEDDING_API_KEY: z.string().optional(),
  AI_FALLBACK_PROVIDER: providerEnum.optional(),
  AI_FALLBACK_API_KEY: z.string().optional(),
  AI_FALLBACK_MODEL: z.string().optional(),
  AI_FALLBACK_EMBEDDING_MODEL: z.string().optional(),
  AI_FALLBACK_EMBEDDING_DIMENSIONS: z.coerce
    .number()
    .int()
    .positive()
    .optional(),
});

export type AiProviderName = z.infer<typeof aiSchema>['AI_PROVIDER'];
