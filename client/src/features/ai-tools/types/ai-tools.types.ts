export interface CvExperience {
  company: string;
  role: string;
  duration: string;
  responsibilities: string[];
}

export interface CvEducation {
  institution: string;
  degree: string;
  year?: string | null;
}

export interface CvParserOutput {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  summary: string;
  skills: string[];
  experience: CvExperience[];
  education: CvEducation[];
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'staff';

export interface JobExtractorOutput {
  title: string;
  company: string;
  location: string;
  salary_range?: string | null;
  job_type: JobType;
  seniority_level: SeniorityLevel;
  required_skills: string[];
  preferred_skills?: string[] | null;
}

export interface JobMatcherOutput {
  compatibility_score: number;
  matching_skills: string[];
  missing_skills: string[];
  reasoning: string;
}

export interface AiToolRecordMeta {
  id: string;
  model: string;
  provider: string;
}

export interface ParseCvResponse extends AiToolRecordMeta {
  result: CvParserOutput;
}

export interface ExtractJobResponse extends AiToolRecordMeta {
  result: JobExtractorOutput;
}

export interface MatchJobResponse extends AiToolRecordMeta {
  result: JobMatcherOutput;
}

export interface MatchJobByIdsRequest {
  cvId: string;
  jobId: string;
}

export interface MatchJobInlineRequest {
  cv: CvParserOutput;
  job: JobExtractorOutput;
}
