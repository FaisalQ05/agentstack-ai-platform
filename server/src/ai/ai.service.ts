import { Inject, Injectable, Logger } from '@nestjs/common';
import { TypedConfigService } from '../config/typed-config.service';
import {
  AI_FALLBACK_PROVIDER,
  AI_PROVIDER,
  AiCompletionOptions,
  AiCompletionResult,
  AiEmbeddingOptions,
  AiEmbeddingResult,
  AiProvider,
  AiStructuredGenerateOptions,
  AiStructuredGenerateResult,
} from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER)
    private readonly provider: AiProvider,
    @Inject(AI_FALLBACK_PROVIDER)
    private readonly fallbackProvider: AiProvider | null,
    private readonly config: TypedConfigService,
  ) {}

  get activeProvider(): string {
    return this.provider.name;
  }

  get fallbackProviderName(): string | null {
    return this.fallbackProvider?.name ?? null;
  }

  complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    return this.provider.complete(options);
  }

  async completeWithFallback(
    options: AiCompletionOptions,
  ): Promise<AiCompletionResult> {
    return this.runWithFallback(
      'complete',
      () => this.provider.complete(options),
      () =>
        this.fallbackProvider!.complete({
          ...options,
          model: options.model ?? this.config.ai.fallback?.model,
        }),
    );
  }

  streamComplete(options: AiCompletionOptions): AsyncGenerator<string> {
    return this.provider.streamComplete(options);
  }

  generateStructured(
    options: AiStructuredGenerateOptions,
  ): Promise<AiStructuredGenerateResult> {
    return this.provider.generateStructured(options);
  }

  embed(options: AiEmbeddingOptions): Promise<AiEmbeddingResult> {
    return this.provider.embed(this.primaryEmbedOptions(options));
  }

  async embedWithFallback(
    options: AiEmbeddingOptions,
  ): Promise<AiEmbeddingResult> {
    const primaryOptions = this.primaryEmbedOptions(options);
    const fallbackOptions = this.fallbackEmbedOptions(options);

    return this.runWithFallback(
      'embed',
      () => this.provider.embed(primaryOptions),
      () => this.fallbackProvider!.embed(fallbackOptions),
    );
  }

  private primaryEmbedOptions(
    options: AiEmbeddingOptions,
  ): AiEmbeddingOptions {
    return {
      input: options.input,
      model: options.model ?? this.config.ai.embeddingModel,
      dimensions:
        options.dimensions ?? this.config.ai.embeddingDimensions,
    };
  }

  private fallbackEmbedOptions(
    options: AiEmbeddingOptions,
  ): AiEmbeddingOptions {
    const fb = this.config.ai.fallback;
    return {
      input: options.input,
      model: fb?.embeddingModel ?? undefined,
      dimensions: fb?.embeddingDimensions ?? this.config.ai.embeddingDimensions,
    };
  }

  private async runWithFallback<T extends { provider: string }>(
    operation: string,
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await primary();
    } catch (primaryError) {
      if (!this.fallbackProvider) {
        throw primaryError;
      }

      this.logger.warn(
        `${operation} failed on ${this.provider.name}, retrying with ${this.fallbackProvider.name}`,
      );

      try {
        const result = await fallback();
        this.logger.log(
          `${operation} succeeded via fallback provider ${result.provider}`,
        );
        return result;
      } catch (fallbackError) {
        const primaryMsg =
          primaryError instanceof Error
            ? primaryError.message
            : String(primaryError);
        const fallbackMsg =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        throw new Error(
          `${operation} failed on ${this.provider.name} (${primaryMsg}) and fallback ${this.fallbackProvider.name} (${fallbackMsg})`,
        );
      }
    }
  }
}
