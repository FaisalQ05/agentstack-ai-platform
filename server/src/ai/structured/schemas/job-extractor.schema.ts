import { z } from 'zod';

export const jobTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'internship',
]);

export const seniorityLevelSchema = z.enum([
  'junior',
  'mid',
  'senior',
  'lead',
  'staff',
]);

export const jobExtractorOutputSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  salary_range: z.string().nullable(),
  job_type: jobTypeSchema,
  seniority_level: seniorityLevelSchema,
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()).nullable(),
});

export type JobExtractorOutput = z.infer<typeof jobExtractorOutputSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type SeniorityLevel = z.infer<typeof seniorityLevelSchema>;

export const JOB_EXTRACTOR_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    company: { type: 'string' },
    location: { type: 'string' },
    salary_range: { type: ['string', 'null'] },
    job_type: {
      type: 'string',
      enum: ['full-time', 'part-time', 'contract', 'internship'],
    },
    seniority_level: {
      type: 'string',
      enum: ['junior', 'mid', 'senior', 'lead', 'staff'],
    },
    required_skills: { type: 'array', items: { type: 'string' } },
    preferred_skills: {
      type: ['array', 'null'],
      items: { type: 'string' },
    },
  },
  required: [
    'title',
    'company',
    'location',
    'salary_range',
    'job_type',
    'seniority_level',
    'required_skills',
    'preferred_skills',
  ],
  additionalProperties: false,
} as const;

export function normalizeJobExtractorOutput(
  data: z.infer<typeof jobExtractorOutputSchema>,
): JobExtractorOutput {
  return data;
}
