import { registerAs } from '@nestjs/config';
import { ragSchema } from './rag.schema';

export default registerAs('rag', () => {
  const parsed = ragSchema.parse(process.env);

  return {
    chunkSize: parsed.RAG_CHUNK_SIZE,
    chunkOverlap: parsed.RAG_CHUNK_OVERLAP,
    topK: parsed.RAG_TOP_K,
  };
});
