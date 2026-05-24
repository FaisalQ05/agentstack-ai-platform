import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ContentToolsController } from './content-tools.controller';
import { ContentToolsService } from './content-tools.service';

@Module({
  imports: [AiModule],
  controllers: [ContentToolsController],
  providers: [ContentToolsService],
  exports: [ContentToolsService],
})
export class ContentToolsModule {}
