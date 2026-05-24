import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { TypedConfigService } from '../config/typed-config.service';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly aiService: AiService,
    private readonly config: TypedConfigService,
  ) {}

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embedTexts([text]);
    return embedding;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const trimmed = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmed.length === 0) return [];

    const { embeddings } = await this.aiService.embedWithFallback({
      input: trimmed,
      model: this.config.ai.embeddingModel,
      dimensions: this.config.ai.embeddingDimensions,
    });

    this.assertVectorDimensions(embeddings);

    return embeddings;
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
