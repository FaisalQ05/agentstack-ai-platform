import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ExtractJobDto, MatchJobDto, ParseCvDto } from './dto/ai-tools.dto';
import {
  ExtractJobResponse,
  MatchJobResponse,
  ParseCvResponse,
} from './interfaces/ai-tools.interfaces';
import { CvParserService } from './services/cv-parser.service';
import { JobExtractorService } from './services/job-extractor.service';
import { JobMatcherService } from './services/job-matcher.service';

@Controller('ai-tools')
export class AiToolsController {
  constructor(
    private readonly cvParserService: CvParserService,
    private readonly jobExtractorService: JobExtractorService,
    private readonly jobMatcherService: JobMatcherService,
  ) {}

  @Post('cv/parse')
  parseCv(@Body() dto: ParseCvDto): Promise<ParseCvResponse> {
    return this.cvParserService.parse(dto.text);
  }

  @Post('jobs/extract')
  extractJob(@Body() dto: ExtractJobDto): Promise<ExtractJobResponse> {
    return this.jobExtractorService.extract(dto.text);
  }

  @Post('jobs/match')
  async matchJob(@Body() dto: MatchJobDto): Promise<MatchJobResponse> {
    if (dto.cvId && dto.jobId) {
      return this.jobMatcherService.matchByIds(dto.cvId, dto.jobId);
    }

    if (dto.cv && dto.job) {
      return this.jobMatcherService.matchInline(
        this.jobMatcherService.toZodMatcherInput({
          cv: dto.cv as unknown as Record<string, unknown>,
          job: dto.job as unknown as Record<string, unknown>,
        }),
      );
    }

    throw new BadRequestException(
      'Provide either cvId + jobId or inline cv + job objects',
    );
  }
}
