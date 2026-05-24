-- all-MiniLM-L6-v2 (local default) uses 384 dimensions.
-- Re-index all RAG documents after applying if you previously used 768-dim vectors.

DROP INDEX IF EXISTS "rag_chunks_embedding_idx";

ALTER TABLE "rag_chunks"
  ALTER COLUMN "embedding" TYPE vector(384);

CREATE INDEX "rag_chunks_embedding_idx" ON "rag_chunks" USING hnsw ("embedding" vector_cosine_ops);
