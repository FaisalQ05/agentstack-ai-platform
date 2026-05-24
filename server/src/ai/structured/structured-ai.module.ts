import { Global, Module } from '@nestjs/common';
import { AiModule } from '../ai.module';
import { StructuredAiService } from './structured-ai.service';

@Global()
@Module({
  imports: [AiModule],
  providers: [StructuredAiService],
  exports: [StructuredAiService],
})
export class StructuredAiModule {}
