import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { EmbeddingService } from './embedding.service';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { VectorSearchService } from './vector-search.service';

@Module({
  imports: [AiModule],
  controllers: [RagController],
  providers: [EmbeddingService, VectorSearchService, RagService],
  exports: [EmbeddingService, VectorSearchService, RagService],
})
export class RagModule {}
