import { Injectable, NotFoundException } from '@nestjs/common';
import {
  JOB_MATCHER_JSON_SCHEMA,
  JobMatcherInput,
  JobMatcherOutput,
  jobMatcherInputSchema,
  jobMatcherOutputSchema,
} from '../../ai/structured/schemas/job-matcher.schema';
import { StructuredAiService } from '../../ai/structured/structured-ai.service';
import { JOB_MATCHER_SYSTEM_PROMPT } from '../prompts/structured.prompts';
import { PrismaService } from '../../prisma/prisma.service';
import { CvParserService } from './cv-parser.service';
import { JobExtractorService } from './job-extractor.service';

@Injectable()
export class JobMatcherService {
  constructor(
    private readonly structuredAi: StructuredAiService,
    private readonly prisma: PrismaService,
    private readonly cvParserService: CvParserService,
    private readonly jobExtractorService: JobExtractorService,
  ) {}

  async matchByIds(
    cvId: string,
    jobId: string,
  ): Promise<{
    id: string;
    result: JobMatcherOutput;
    model: string;
    provider: string;
  }> {
    const cv = await this.cvParserService.findById(cvId).catch(() => {
      throw new NotFoundException(`CV ${cvId} not found`);
    });

    const job = await this.jobExtractorService.findById(jobId).catch(() => {
      throw new NotFoundException(`Job posting ${jobId} not found`);
    });

    return this.match({ cv, job }, cvId, jobId);
  }

  async matchInline(input: JobMatcherInput): Promise<{
    id: string;
    result: JobMatcherOutput;
    model: string;
    provider: string;
  }> {
    return this.match(jobMatcherInputSchema.parse(input));
  }

  toZodMatcherInput(input: {
    cv: Record<string, unknown>;
    job: Record<string, unknown>;
  }): JobMatcherInput {
    const cv = input.cv as JobMatcherInput['cv'];
    const job = input.job as JobMatcherInput['job'];

    return {
      cv: {
        ...cv,
        email: cv.email ?? null,
        phone: cv.phone ?? null,
        location: cv.location ?? null,
        education: cv.education.map((item) => ({
          ...item,
          year: item.year ?? null,
        })),
      },
      job: {
        ...job,
        salary_range: job.salary_range ?? null,
        preferred_skills: job.preferred_skills ?? null,
      },
    };
  }

  private async match(
    input: JobMatcherInput,
    cvId?: string,
    jobId?: string,
  ): Promise<{
    id: string;
    result: JobMatcherOutput;
    model: string;
    provider: string;
  }> {
    const { data, model, provider } = await this.structuredAi.generate({
      schemaName: 'job_matcher_output',
      jsonSchema: JOB_MATCHER_JSON_SCHEMA,
      zodSchema: jobMatcherOutputSchema,
      systemPrompt: JOB_MATCHER_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(input),
    });

    const record = await this.prisma.jobMatch.create({
      data: {
        cvId: cvId ?? null,
        jobId: jobId ?? null,
        result: data,
        model,
        provider,
      },
    });

    return { id: record.id, result: data, model, provider };
  }
}
