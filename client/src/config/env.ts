import { z } from 'zod';

/**
 * 1. Define schema (single source of truth)
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

/**
 * 2. Validate once at boot
 */
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

console.log({ parsed });

if (!parsed.success) {
  console.log({ error: parsed.error });
  console.error('❌ Invalid environment variables:');
  console.error(z.treeifyError(parsed.error).errors);

  throw new Error('Invalid environment variables');
}

/**
 * 3. Export typed env
 */
export const env = parsed.data;
