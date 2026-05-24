import { Body, Controller, Post } from '@nestjs/common';
import { ContentToolsService } from './content-tools.service';
import {
  ExtractKeywordsDto,
  GenerateDescriptionDto,
  RewriteDto,
  SummarizeDto,
} from './dto/content-tools.dto';
import {
  ExtractKeywordsResult,
  GenerateDescriptionResult,
  RewriteResult,
  SummarizeResult,
} from './interfaces/content-tools.interfaces';

@Controller()
export class ContentToolsController {
  constructor(private readonly contentToolsService: ContentToolsService) {}

  @Post('summarize')
  summarize(@Body() dto: SummarizeDto): Promise<SummarizeResult> {
    return this.contentToolsService.summarize(dto);
  }

  @Post('rewrite')
  rewrite(@Body() dto: RewriteDto): Promise<RewriteResult> {
    return this.contentToolsService.rewrite(dto);
  }

  @Post('extract-keywords')
  extractKeywords(
    @Body() dto: ExtractKeywordsDto,
  ): Promise<ExtractKeywordsResult> {
    return this.contentToolsService.extractKeywords(dto);
  }

  @Post('generate-description')
  generateDescription(
    @Body() dto: GenerateDescriptionDto,
  ): Promise<GenerateDescriptionResult> {
    return this.contentToolsService.generateDescription(dto);
  }
}
