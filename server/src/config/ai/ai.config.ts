import { registerAs } from '@nestjs/config';
import { aiSchema } from './ai.schema';

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
} as const;

export default registerAs('ai', () => {
  const parsed = aiSchema.parse(process.env);

  return {
    provider: parsed.AI_PROVIDER,
    apiKey: parsed.AI_API_KEY,
    model: parsed.AI_MODEL ?? DEFAULT_MODELS[parsed.AI_PROVIDER],
  };
});
