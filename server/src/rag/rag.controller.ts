import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IngestDocumentDto, RagAskDto } from './dto/rag.dto';
import {
  IngestDocumentResult,
  RagAskResult,
  RagDocumentSummary,
} from './interfaces/rag.interfaces';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('documents')
  ingestDocument(
    @Body() dto: IngestDocumentDto,
  ): Promise<IngestDocumentResult> {
    return this.ragService.ingestDocument(dto);
  }

  @Get('documents')
  listDocuments(): Promise<RagDocumentSummary[]> {
    return this.ragService.listDocuments();
  }

  @Delete('documents/:documentId')
  deleteDocument(
    @Param('documentId') documentId: string,
  ): Promise<{ deleted: true }> {
    return this.ragService.deleteDocument(documentId).then(() => ({
      deleted: true as const,
    }));
  }

  @Post('ask')
  ask(@Body() dto: RagAskDto): Promise<RagAskResult> {
    return this.ragService.ask(dto);
  }
}
