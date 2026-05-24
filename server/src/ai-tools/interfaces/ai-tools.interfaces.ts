import { CvParserOutput } from '../../ai/structured/schemas/cv-parser.schema';
import { JobExtractorOutput } from '../../ai/structured/schemas/job-extractor.schema';
import { JobMatcherOutput } from '../../ai/structured/schemas/job-matcher.schema';

export interface AiToolMeta {
  id: string;
  model: string;
  provider: string;
}

export interface ParseCvResponse extends AiToolMeta {
  result: CvParserOutput;
}

export interface ExtractJobResponse extends AiToolMeta {
  result: JobExtractorOutput;
}

export interface MatchJobResponse extends AiToolMeta {
  result: JobMatcherOutput;
}
