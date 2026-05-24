import { Module } from '@nestjs/common';
import { TypedConfigService } from '../config/typed-config.service';
import {
  buildFallbackProvider,
  buildPrimaryProvider,
} from './ai-provider.factory';
import { AiService } from './ai.service';
import {
  AI_FALLBACK_PROVIDER,
  AI_PROVIDER,
} from './interfaces/ai-provider.interface';

@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => buildPrimaryProvider(config),
    },
    {
      provide: AI_FALLBACK_PROVIDER,
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => buildFallbackProvider(config),
    },
    AiService,
  ],
  exports: [AiService, AI_PROVIDER, AI_FALLBACK_PROVIDER],
})
export class AiModule {}
