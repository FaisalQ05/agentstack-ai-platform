import { Module } from '@nestjs/common';
import { StructuredAiModule } from '../ai/structured/structured-ai.module';
import { AiToolsController } from './ai-tools.controller';
import { CvParserService } from './services/cv-parser.service';
import { JobExtractorService } from './services/job-extractor.service';
import { JobMatcherService } from './services/job-matcher.service';

@Module({
  imports: [StructuredAiModule],
  controllers: [AiToolsController],
  providers: [CvParserService, JobExtractorService, JobMatcherService],
  exports: [CvParserService, JobExtractorService, JobMatcherService],
})
export class AiToolsModule {}
