import { z } from 'zod';

export const authSchema = z.object({
  ACCESS_TOKEN_SECRET: z.string().min(6),
  REFRESH_TOKEN_SECRET: z.string().min(6),
  ACCESS_TOKEN_TTL: z.string().regex(/^\d+(ms|s|m|h|d)$/),
  REFRESH_TOKEN_TTL: z.string().regex(/^\d+(ms|s|m|h|d)$/),
  SALT_ROUNDS: z.coerce.number().default(10),
});
