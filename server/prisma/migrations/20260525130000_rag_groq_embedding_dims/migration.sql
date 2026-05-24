-- Groq nomic-embed-text-v1_5 uses 768 dimensions (OpenAI text-embedding-3-small uses 1536).
-- Re-index all RAG documents after applying this migration if you previously used 1536-dim vectors.

DROP INDEX IF EXISTS "rag_chunks_embedding_idx";

ALTER TABLE "rag_chunks"
  ALTER COLUMN "embedding" TYPE vector(768);

CREATE INDEX "rag_chunks_embedding_idx" ON "rag_chunks" USING hnsw ("embedding" vector_cosine_ops);
