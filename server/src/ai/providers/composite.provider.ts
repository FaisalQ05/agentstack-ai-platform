import {
  AiCompletionOptions,
  AiCompletionResult,
  AiEmbeddingOptions,
  AiEmbeddingResult,
  AiProvider,
  AiStructuredGenerateOptions,
  AiStructuredGenerateResult,
} from '../interfaces/ai-provider.interface';

/**
 * Routes chat/structured calls to one provider and embeddings to another
 * (e.g. Groq for generation, OpenAI for RAG vectors).
 */
export class CompositeAiProvider implements AiProvider {
  readonly name: string;

  constructor(
    private readonly chatProvider: AiProvider,
    private readonly embeddingProvider: AiProvider,
  ) {
    this.name = chatProvider.name;
  }

  complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    return this.chatProvider.complete(options);
  }

  streamComplete(options: AiCompletionOptions): AsyncGenerator<string> {
    return this.chatProvider.streamComplete(options);
  }

  generateStructured(
    options: AiStructuredGenerateOptions,
  ): Promise<AiStructuredGenerateResult> {
    return this.chatProvider.generateStructured(options);
  }

  embed(options: AiEmbeddingOptions): Promise<AiEmbeddingResult> {
    return this.embeddingProvider.embed(options);
  }
}
