import { z } from 'zod';

export const aiSchema = z.object({
  AI_PROVIDER: z.enum(['openai', 'groq']).default('openai'),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().optional(),
});

export type AiProviderName = z.infer<typeof aiSchema>['AI_PROVIDER'];
