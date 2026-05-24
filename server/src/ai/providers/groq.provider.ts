import OpenAI from 'openai';
import {
  AiCompletionOptions,
  AiCompletionResult,
  AiEmbeddingOptions,
  AiEmbeddingResult,
  AiProvider,
  AiStructuredGenerateOptions,
  AiStructuredGenerateResult,
} from '../interfaces/ai-provider.interface';
import { executeEmbedding } from './embedding';
import {
  executeStructuredCompletion,
  executeStructuredCompletionJsonObject,
} from './structured-completion';

export class GroqProvider implements AiProvider {
  readonly name = 'groq';

  constructor(
    private readonly client: OpenAI,
    private readonly defaultModel: string,
    private readonly embeddingModel: string,
    private readonly embeddingDimensions: number,
  ) {}

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const model = options.model ?? this.defaultModel;

    const response = await this.client.chat.completions.create({
      model,
      messages: options.messages,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    return {
      content,
      model,
      provider: this.name,
    };
  }

  async *streamComplete(options: AiCompletionOptions): AsyncGenerator<string> {
    const model = options.model ?? this.defaultModel;

    const stream = await this.client.chat.completions.create({
      model,
      messages: options.messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  async generateStructured(
    options: AiStructuredGenerateOptions,
  ): Promise<AiStructuredGenerateResult> {
    try {
      return await executeStructuredCompletion(
        this.client,
        this.name,
        this.defaultModel,
        options,
      );
    } catch {
      return executeStructuredCompletionJsonObject(
        this.client,
        this.name,
        this.defaultModel,
        options,
      );
    }
  }

  embed(options: AiEmbeddingOptions): Promise<AiEmbeddingResult> {
    return executeEmbedding(
      this.client,
      this.name,
      this.embeddingModel,
      this.embeddingDimensions,
      options,
    );
  }
}
