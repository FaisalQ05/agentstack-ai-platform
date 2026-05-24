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
    console.log('IN GROQ PROVIDER');

    const model = options.model ?? this.defaultModel;

    console.log({ model });
    console.log({ messages: options.messages });

    const response = await this.client.chat.completions.create({
      model,
      messages: options.messages,
    });

    console.log({ response });

    const content = response.choices[0]?.message?.content?.trim();

    console.log({ content });

    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    return {
      content,
      model,
      provider: this.name,
    };
  }
}
