import { z } from 'zod';

export const appSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:3000'),
});
