import { Injectable, Logger } from '@nestjs/common';
import { TypedConfigService } from '../config/typed-config.service';
import {
  resolveEmbeddingConfig,
} from './ai-provider.factory';
import {
  AiEmbeddingResult,
  AiProvider,
} from './interfaces/ai-provider.interface';
import { LocalEmbeddingService } from './local/local-embedding.service';
import {
  createAiProvider,
  ProviderName,
} from './providers/create-provider';

const LOCAL_MODEL = 'all-MiniLM-L6-v2';

@Injectable()
export class EmbeddingGeneratorService {
  private readonly logger = new Logger(EmbeddingGeneratorService.name);
  private openAiProvider: AiProvider | null = null;
  private groqProvider: AiProvider | null = null;

  constructor(
    private readonly config: TypedConfigService,
    private readonly localEmbedding: LocalEmbeddingService,
  ) {}

  async generateEmbedding(text: string): Promise<AiEmbeddingResult> {
    const result = await this.generateEmbeddings([text]);
    return result;
  }

  async generateEmbeddings(texts: string[]): Promise<AiEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], model: LOCAL_MODEL, provider: 'local' };
    }

    const trimmed = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmed.length === 0) {
      return { embeddings: [], model: LOCAL_MODEL, provider: 'local' };
    }

    const errors: string[] = [];
    const dimensions = this.config.ai.embeddingDimensions;
    const model = this.config.ai.embeddingModel;

    const chain: Array<{
      name: string;
      run: () => Promise<AiEmbeddingResult>;
    }> = [
      {
        name: 'local',
        run: async () => {
          const embeddings =
            await this.localEmbedding.generateEmbeddings(trimmed);
          this.assertDimensions(embeddings, dimensions);
          return {
            embeddings,
            model: LOCAL_MODEL,
            provider: 'local',
          };
        },
      },
      {
        name: 'openai',
        run: () =>
          this.embedWithCloudProvider('openai', trimmed, model, dimensions),
      },
      {
        name: 'groq',
        run: () =>
          this.embedWithCloudProvider('groq', trimmed, model, dimensions),
      },
    ];

    for (const step of chain) {
      try {
        const result = await step.run();
        if (step.name !== 'local') {
          this.logger.log(
            `Embeddings served via fallback provider: ${result.provider}`,
          );
        }
        return result;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : String(error);
        errors.push(`${step.name}: ${msg}`);
        this.logger.warn(`Embedding provider ${step.name} failed: ${msg}`);
      }
    }

    throw new Error(
      `All embedding providers failed (local → openai → groq): ${errors.join('; ')}`,
    );
  }

  private async embedWithCloudProvider(
    name: ProviderName,
    input: string[],
    model: string,
    dimensions: number,
  ): Promise<AiEmbeddingResult> {
    const provider = this.getCloudProvider(name);
    const apiKey = this.resolveApiKey(name);

    if (!apiKey) {
      throw new Error(`No API key configured for ${name} embedding fallback`);
    }

    const result = await provider.embed({
      input,
      model,
      dimensions,
    });

    this.assertDimensions(result.embeddings, dimensions);
    return result;
  }

  private getCloudProvider(name: ProviderName): AiProvider {
    if (name === 'openai') {
      if (!this.openAiProvider) {
        const embedding = resolveEmbeddingConfig('openai');
        this.openAiProvider = createAiProvider({
          name: 'openai',
          apiKey: this.resolveApiKey('openai')!,
          chatModel: embedding.model,
          embedding,
        });
      }
      return this.openAiProvider;
    }

    if (!this.groqProvider) {
      const embedding = resolveEmbeddingConfig('groq');
      this.groqProvider = createAiProvider({
        name: 'groq',
        apiKey: this.resolveApiKey('groq')!,
        chatModel: embedding.model,
        embedding,
      });
    }
    return this.groqProvider;
  }

  private resolveApiKey(name: ProviderName): string | undefined {
    if (name === 'openai') {
      return (
        this.config.ai.embeddingApiKey ||
        (this.config.ai.provider === 'openai'
          ? this.config.ai.apiKey
          : undefined)
      );
    }

    return this.config.ai.apiKey;
  }

  private assertDimensions(
    embeddings: number[][],
    expected: number,
  ): void {
    for (const vector of embeddings) {
      if (vector.length !== expected) {
        throw new Error(
          `Embedding dimension mismatch: expected ${expected}, got ${vector.length}`,
        );
      }
    }
  }
}
