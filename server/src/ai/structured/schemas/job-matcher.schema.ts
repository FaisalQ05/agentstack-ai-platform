import { z } from 'zod';
import { cvParserOutputSchema } from './cv-parser.schema';
import { jobExtractorOutputSchema } from './job-extractor.schema';

export const jobMatcherOutputSchema = z.object({
  compatibility_score: z.number().min(0).max(100),
  matching_skills: z.array(z.string()),
  missing_skills: z.array(z.string()),
  reasoning: z.string().min(1),
});

export type JobMatcherOutput = z.infer<typeof jobMatcherOutputSchema>;

export const jobMatcherInputSchema = z.object({
  cv: cvParserOutputSchema,
  job: jobExtractorOutputSchema,
});

export type JobMatcherInput = z.infer<typeof jobMatcherInputSchema>;

export const JOB_MATCHER_JSON_SCHEMA = {
  type: 'object',
  properties: {
    compatibility_score: { type: 'number' },
    matching_skills: { type: 'array', items: { type: 'string' } },
    missing_skills: { type: 'array', items: { type: 'string' } },
    reasoning: { type: 'string' },
  },
  required: [
    'compatibility_score',
    'matching_skills',
    'missing_skills',
    'reasoning',
  ],
  additionalProperties: false,
} as const;
