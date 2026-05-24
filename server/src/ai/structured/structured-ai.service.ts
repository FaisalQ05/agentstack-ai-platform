import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TypedConfigService } from '../../config/typed-config.service';
import { AI_PROVIDER, AiProvider } from '../interfaces/ai-provider.interface';

export interface StructuredGenerateOptions<T extends z.ZodType> {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  zodSchema: T;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

export interface StructuredGenerateResult<T> {
  data: T;
  model: string;
  provider: string;
}

@Injectable()
export class StructuredAiService {
  constructor(
    @Inject(AI_PROVIDER)
    private readonly provider: AiProvider,
    private readonly config: TypedConfigService,
  ) {}

  async generate<T extends z.ZodType>(
    options: StructuredGenerateOptions<T>,
  ): Promise<StructuredGenerateResult<z.infer<T>>> {
    let lastError: string | null = null;
    const model = options.model ?? this.config.ai.structuredModel;

    console.log({ options });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const {
          content,
          model: usedModel,
          provider,
        } = await this.provider.generateStructured({
          systemPrompt: options.systemPrompt,
          userPrompt: options.userPrompt,
          schema: {
            name: options.schemaName,
            jsonSchema: options.jsonSchema,
          },
          model,
        });

        const parsed: unknown = JSON.parse(content);
        console.log({ parsed });
        const validated = options.zodSchema.parse(parsed);
        console.log({ validated });

        return {
          data: validated,
          model: usedModel,
          provider,
        };
      } catch (error) {
        lastError =
          error instanceof z.ZodError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Unknown validation error';
      }
    }

    throw new BadRequestException(
      `AI returned invalid structured JSON after retry: ${lastError ?? 'unknown error'}`,
    );
  }
}
