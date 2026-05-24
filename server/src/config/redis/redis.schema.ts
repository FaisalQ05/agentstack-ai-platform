import { z } from 'zod';

export const redisSchema = z.object({
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
});
