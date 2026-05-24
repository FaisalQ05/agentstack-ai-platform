import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { AiService } from '../ai/ai.service';
import { TypedConfigService } from '../config/typed-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { IngestDocumentDto, RagAskDto } from './dto/rag.dto';
import { EmbeddingService } from './embedding.service';
import {
  IngestDocumentResult,
  RagAskResult,
  RagDocumentSummary,
} from './interfaces/rag.interfaces';
import { buildRagUserPrompt, RAG_SYSTEM_PROMPT } from './rag.constants';
import { VectorSearchService } from './vector-search.service';
import { chunkText } from './utils/chunk-text.util';
import { formatContextForPrompt } from './utils/format-context.util';

@Injectable()
export class RagService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorSearch: VectorSearchService,
    private readonly aiService: AiService,
    private readonly config: TypedConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.vectorSearch.ensurePgVectorReady();
    this.assertEmbeddingConfigured();
  }

  private assertEmbeddingConfigured(): void {
    const { provider, embeddingProvider, embeddingApiKey } = this.config.ai;

    if (provider === 'groq' && embeddingProvider === 'openai' && !embeddingApiKey) {
      throw new Error(
        'AI_EMBEDDING_API_KEY is required when AI_PROVIDER=groq. Groq does not host embedding models — set an OpenAI API key for RAG indexing.',
      );
    }
  }

  async ingestDocument(dto: IngestDocumentDto): Promise<IngestDocumentResult> {
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Document content cannot be empty');
    }

    const chunkSize = dto.chunkSize ?? this.config.rag.chunkSize;
    const chunkOverlap = dto.chunkOverlap ?? this.config.rag.chunkOverlap;

    const textChunks = chunkText(content, { chunkSize, chunkOverlap });
    if (textChunks.length === 0) {
      throw new BadRequestException('No chunks produced from document content');
    }

    const document = await this.prisma.ragDocument.create({
      data: {
        title: dto.title.trim(),
        source: dto.source?.trim() || null,
        metadata: (dto.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });

    const chunkRecords = textChunks.map((chunkContent, index) => ({
      id: randomUUID(),
      content: chunkContent,
      chunkIndex: index,
    }));

    const embedResult = await this.aiService.embedWithFallback({
      input: chunkRecords.map((c) => c.content),
      model: this.config.ai.embeddingModel,
      dimensions: this.config.ai.embeddingDimensions,
    });

    if (embedResult.embeddings.length !== chunkRecords.length) {
      await this.prisma.ragDocument.delete({ where: { id: document.id } });
      throw new BadRequestException(
        'Embedding count mismatch for document chunks',
      );
    }

    await this.vectorSearch.insertChunkEmbeddings(
      document.id,
      chunkRecords,
      embedResult.embeddings,
    );

    return {
      documentId: document.id,
      title: document.title,
      chunkCount: chunkRecords.length,
      embeddingModel: embedResult.model,
      embeddingProvider: embedResult.provider,
    };
  }

  async ask(dto: RagAskDto): Promise<RagAskResult> {
    const question = dto.question.trim();
    if (!question) {
      throw new BadRequestException('Question cannot be empty');
    }

    const topK = dto.topK ?? this.config.rag.topK;

    if (dto.documentId) {
      const doc = await this.prisma.ragDocument.findUnique({
        where: { id: dto.documentId },
      });
      if (!doc) {
        throw new NotFoundException(`Document ${dto.documentId} not found`);
      }
      const hasChunks = await this.vectorSearch.documentHasChunks(
        dto.documentId,
      );
      if (!hasChunks) {
        throw new BadRequestException('Document has no indexed chunks');
      }
    } else {
      const totalChunks = await this.vectorSearch.countChunks();
      if (totalChunks === 0) {
        throw new BadRequestException(
          'No indexed documents. Ingest a document before asking questions.',
        );
      }
    }

    const queryEmbedding = await this.embeddingService.embedQuery(question);

    const chunks = await this.vectorSearch.searchSimilar({
      embedding: queryEmbedding,
      topK,
      documentId: dto.documentId,
    });

    if (chunks.length === 0) {
      return {
        answer: "I don't know based on the provided context.",
        question,
        chunks: [],
        model: this.config.ai.model,
        provider: this.aiService.activeProvider,
      };
    }

    const contextBlock = formatContextForPrompt(chunks);

    const completion = await this.aiService.completeWithFallback({
      messages: [
        { role: 'system', content: RAG_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildRagUserPrompt(question, contextBlock),
        },
      ],
    });

    return {
      answer: completion.content,
      question,
      chunks,
      model: completion.model,
      provider: completion.provider,
    };
  }

  async listDocuments(): Promise<RagDocumentSummary[]> {
    const documents = await this.prisma.ragDocument.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { chunks: true } } },
    });

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      chunkCount: doc._count.chunks,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));
  }

  async deleteDocument(documentId: string): Promise<void> {
    const doc = await this.prisma.ragDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    await this.vectorSearch.deleteChunksByDocument(documentId);
    await this.prisma.ragDocument.delete({ where: { id: documentId } });
  }
}
