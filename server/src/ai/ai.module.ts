import { Module } from '@nestjs/common';
import OpenAI from 'openai';
import { TypedConfigService } from '../config/typed-config.service';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './interfaces/ai-provider.interface';
import { GroqProvider } from './providers/groq.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const { provider, apiKey, model } = config.ai;

        if (provider === 'groq') {
          const client = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
          });

          return new GroqProvider(client, model);
        }

        const client = new OpenAI({ apiKey });
        return new OpenAiProvider(client, model);
      },
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
