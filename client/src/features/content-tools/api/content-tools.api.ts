import { post } from '@/shared/api/methods';
import { ApiSuccess } from '@/shared/types/api/api.types';
import {
  ExtractKeywordsRequest,
  ExtractKeywordsResponse,
  GenerateDescriptionRequest,
  GenerateDescriptionResponse,
  RewriteRequest,
  RewriteResponse,
  SummarizeRequest,
  SummarizeResponse,
} from '../types/content-tools.types';

async function unwrap<T>(promise: Promise<ApiSuccess<T>>): Promise<T> {
  const response = await promise;
  return response.data;
}

export function summarize(body: SummarizeRequest) {
  return unwrap(post<ApiSuccess<SummarizeResponse>>('/summarize', body));
}

export function rewrite(body: RewriteRequest) {
  return unwrap(post<ApiSuccess<RewriteResponse>>('/rewrite', body));
}

export function extractKeywords(body: ExtractKeywordsRequest) {
  return unwrap(
    post<ApiSuccess<ExtractKeywordsResponse>>('/extract-keywords', body),
  );
}

export function generateDescription(body: GenerateDescriptionRequest) {
  return unwrap(
    post<ApiSuccess<GenerateDescriptionResponse>>(
      '/generate-description',
      body,
    ),
  );
}
