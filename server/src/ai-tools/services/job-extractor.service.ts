import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import {
  JOB_EXTRACTOR_JSON_SCHEMA,
  JobExtractorOutput,
  jobExtractorOutputSchema,
  normalizeJobExtractorOutput,
} from '../../ai/structured/schemas/job-extractor.schema';
import { StructuredAiService } from '../../ai/structured/structured-ai.service';
import { JOB_EXTRACTOR_SYSTEM_PROMPT } from '../prompts/structured.prompts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobExtractorService {
  constructor(
    private readonly structuredAi: StructuredAiService,
    private readonly prisma: PrismaService,
  ) {}

  async extract(rawText: string): Promise<{
    id: string;
    result: JobExtractorOutput;
    model: string;
    provider: string;
  }> {
    const { data, model, provider } = await this.structuredAi.generate({
      schemaName: 'job_extractor_output',
      jsonSchema: JOB_EXTRACTOR_JSON_SCHEMA as unknown as Record<
        string,
        unknown
      >,
      zodSchema: jobExtractorOutputSchema,
      systemPrompt: JOB_EXTRACTOR_SYSTEM_PROMPT,
      userPrompt: rawText.trim(),
    });

    const result = normalizeJobExtractorOutput(data);

    const record = await this.prisma.jobPosting.create({
      data: {
        rawText: rawText.trim(),
        result: result as unknown as Prisma.InputJsonValue,
        model,
        provider,
      },
    });

    return { id: record.id, result, model, provider };
  }

  async findById(id: string): Promise<JobExtractorOutput> {
    const record = await this.prisma.jobPosting.findUniqueOrThrow({
      where: { id },
    });

    return normalizeJobExtractorOutput(
      jobExtractorOutputSchema.parse(record.result),
    );
  }
}
