import { post } from '@/shared/api/methods';
import { ApiSuccess } from '@/shared/types/api/api.types';
import {
  ExtractJobResponse,
  MatchJobByIdsRequest,
  MatchJobInlineRequest,
  MatchJobResponse,
  ParseCvResponse,
} from '../types/ai-tools.types';

async function unwrap<T>(promise: Promise<ApiSuccess<T>>): Promise<T> {
  const response = await promise;
  return response.data;
}

export function parseCv(text: string) {
  return unwrap(post<ApiSuccess<ParseCvResponse>>('/ai-tools/cv/parse', { text }));
}

export function extractJob(text: string) {
  return unwrap(
    post<ApiSuccess<ExtractJobResponse>>('/ai-tools/jobs/extract', { text }),
  );
}

export function matchJobByIds(body: MatchJobByIdsRequest) {
  return unwrap(
    post<ApiSuccess<MatchJobResponse>>('/ai-tools/jobs/match', body),
  );
}

export function matchJobInline(body: MatchJobInlineRequest) {
  return unwrap(
    post<ApiSuccess<MatchJobResponse>>('/ai-tools/jobs/match', body),
  );
}
