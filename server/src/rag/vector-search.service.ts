import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RetrievedChunk } from './interfaces/rag.interfaces';
import { toPgVectorLiteral } from './utils/format-context.util';

interface VectorSearchRow {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export interface VectorSearchOptions {
  embedding: number[];
  topK: number;
  documentId?: string;
}

@Injectable()
export class VectorSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async insertChunkEmbeddings(
    documentId: string,
    chunks: { id: string; content: string; chunkIndex: number }[],
    embeddings: number[][],
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vector = toPgVectorLiteral(embedding);

      await this.prisma.$executeRaw`
        INSERT INTO rag_chunks (id, "documentId", content, "chunkIndex", embedding)
        VALUES (
          ${chunk.id},
          ${documentId},
          ${chunk.content},
          ${chunk.chunkIndex},
          ${vector}::vector
        )
      `;
    }
  }

  async searchSimilar(
    options: VectorSearchOptions,
  ): Promise<RetrievedChunk[]> {
    const { embedding, topK, documentId } = options;
    const vector = toPgVectorLiteral(embedding);

    const rows = documentId
      ? await this.prisma.$queryRaw<VectorSearchRow[]>`
          SELECT
            c.id,
            c."documentId" AS "documentId",
            d.title AS "documentTitle",
            c.content,
            c."chunkIndex" AS "chunkIndex",
            1 - (c.embedding <=> ${vector}::vector) AS similarity
          FROM rag_chunks c
          INNER JOIN rag_documents d ON d.id = c."documentId"
          WHERE c."documentId" = ${documentId}
          ORDER BY c.embedding <=> ${vector}::vector
          LIMIT ${topK}
        `
      : await this.prisma.$queryRaw<VectorSearchRow[]>`
          SELECT
            c.id,
            c."documentId" AS "documentId",
            d.title AS "documentTitle",
            c.content,
            c."chunkIndex" AS "chunkIndex",
            1 - (c.embedding <=> ${vector}::vector) AS similarity
          FROM rag_chunks c
          INNER JOIN rag_documents d ON d.id = c."documentId"
          ORDER BY c.embedding <=> ${vector}::vector
          LIMIT ${topK}
        `;

    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      documentTitle: row.documentTitle,
      content: row.content,
      chunkIndex: Number(row.chunkIndex),
      similarity: Number(row.similarity),
    }));
  }

  async deleteChunksByDocument(documentId: string): Promise<void> {
    await this.prisma.ragChunk.deleteMany({ where: { documentId } });
  }

  async countChunks(documentId?: string): Promise<number> {
    return this.prisma.ragChunk.count({
      where: documentId ? { documentId } : undefined,
    });
  }

  async documentHasChunks(documentId: string): Promise<boolean> {
    const count = await this.prisma.ragChunk.count({
      where: { documentId },
      take: 1,
    });
    return count > 0;
  }

  /**
   * Ensures pgvector is enabled. Creates the extension when the DB supports it
   * (requires pgvector/pgvector Postgres image or equivalent).
   */
  async ensurePgVectorReady(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(
        'CREATE EXTENSION IF NOT EXISTS vector',
      );
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unknown database error';
      throw new Error(
        `Failed to enable pgvector. Use the pgvector/pgvector Postgres image and recreate the DB volume if you migrated from plain Postgres. Details: ${detail}`,
      );
    }

    const rows = await this.prisma.$queryRaw<{ extname: string }[]>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;

    if (rows.length === 0) {
      throw new Error(
        'pgvector extension is not available after CREATE EXTENSION. Check Postgres image and permissions.',
      );
    }

    await this.ensureRagTables();
  }

  private async ensureRagTables(): Promise<void> {
    const tables = await this.prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('rag_documents', 'rag_chunks')
    `;

    if (tables.length < 2) {
      throw new Error(
        'RAG tables are missing. Run: pnpm prisma migrate deploy (or pnpm prisma:migrate in dev).',
      );
    }
  }
}
