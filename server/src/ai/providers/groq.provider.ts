import OpenAI from 'openai';
import {
  AiCompletionOptions,
  AiCompletionResult,
  AiProvider,
} from '../interfaces/ai-provider.interface';

export class GroqProvider implements AiProvider {
  readonly name = 'groq';

  constructor(
    private readonly client: OpenAI,
    private readonly defaultModel: string,
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

  async *streamComplete(
    options: AiCompletionOptions,
  ): AsyncGenerator<string> {
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
}
