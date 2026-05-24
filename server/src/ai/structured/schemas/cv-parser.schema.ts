import { z } from 'zod';

export const cvExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  duration: z.string().min(1),
  responsibilities: z.array(z.string()),
});

export const cvEducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  year: z.string().nullable(),
});

export const cvParserOutputSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  summary: z.string().min(1),
  skills: z.array(z.string()),
  experience: z.array(cvExperienceSchema),
  education: z.array(cvEducationSchema),
});

export type CvParserOutput = z.infer<typeof cvParserOutputSchema>;

export const CV_PARSER_JSON_SCHEMA = {
  type: 'object',
  properties: {
    fullName: { type: 'string' },
    email: { type: ['string', 'null'] },
    phone: { type: ['string', 'null'] },
    location: { type: ['string', 'null'] },
    summary: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          role: { type: 'string' },
          duration: { type: 'string' },
          responsibilities: { type: 'array', items: { type: 'string' } },
        },
        required: ['company', 'role', 'duration', 'responsibilities'],
        additionalProperties: false,
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          institution: { type: 'string' },
          degree: { type: 'string' },
          year: { type: ['string', 'null'] },
        },
        required: ['institution', 'degree', 'year'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'fullName',
    'email',
    'phone',
    'location',
    'summary',
    'skills',
    'experience',
    'education',
  ],
  additionalProperties: false,
} as const;

export function normalizeCvParserOutput(
  data: z.infer<typeof cvParserOutputSchema>,
): CvParserOutput {
  return data;
}
