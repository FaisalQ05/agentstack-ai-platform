import OpenAI from 'openai';
import {
  AiCompletionOptions,
  AiCompletionResult,
  AiProvider,
} from '../interfaces/ai-provider.interface';

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';

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
      throw new Error('OpenAI returned an empty response');
    }

    return {
      content,
      model,
      provider: this.name,
    };
  }
}
