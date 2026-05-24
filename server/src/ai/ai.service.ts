import { Inject, Injectable } from '@nestjs/common';
import {
  AI_PROVIDER,
  AiCompletionOptions,
  AiCompletionResult,
  AiProvider,
} from './interfaces/ai-provider.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER)
    private readonly provider: AiProvider,
  ) {}

  get activeProvider(): string {
    return this.provider.name;
  }

  complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    return this.provider.complete(options);
  }
}
