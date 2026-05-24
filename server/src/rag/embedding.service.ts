import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { AiEmbeddingResult } from '../ai/interfaces/ai-provider.interface';
import { TypedConfigService } from '../config/typed-config.service';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly aiService: AiService,
    private readonly config: TypedConfigService,
  ) {}

  async embedQuery(text: string): Promise<number[]> {
    const { embeddings } = await this.generate(text);
    return embeddings[0];
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const { embeddings } = await this.generateBatch(texts);
    return embeddings;
  }

  async embedTextsWithMeta(texts: string[]): Promise<AiEmbeddingResult> {
    return this.generateBatch(texts);
  }

  get dimensions(): number {
    return this.config.ai.embeddingDimensions;
  }

  get model(): string {
    return this.config.ai.embeddingModel;
  }

  get provider(): string {
    return this.config.ai.embeddingProvider;
  }

  private async generate(text: string): Promise<AiEmbeddingResult> {
    const result = await this.aiService.generateEmbedding(text);
    this.assertVectorDimensions(result.embeddings);
    return result;
  }

  private async generateBatch(texts: string[]): Promise<AiEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], model: this.model, provider: 'local' };
    }

    const trimmed = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmed.length === 0) {
      return { embeddings: [], model: this.model, provider: 'local' };
    }

    const result = await this.aiService.generateEmbeddings(trimmed);
    this.assertVectorDimensions(result.embeddings);
    return result;
  }

  private assertVectorDimensions(embeddings: number[][]): void {
    const expected = this.config.ai.embeddingDimensions;
    for (const vector of embeddings) {
      if (vector.length !== expected) {
        throw new Error(
          `Embedding dimension mismatch: expected ${expected}, got ${vector.length}. Re-index documents after changing AI_EMBEDDING_* settings.`,
        );
      }
    }
  }
}
