import { z } from 'zod';

export const ragSchema = z.object({
  RAG_CHUNK_SIZE: z.coerce.number().int().positive().default(800),
  RAG_CHUNK_OVERLAP: z.coerce.number().int().nonnegative().default(100),
  RAG_TOP_K: z.coerce.number().int().positive().max(50).default(5),
});
