import { z } from 'zod';

export const databaseSchema = z.object({
  DATABASE_URL: z.url(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
});
