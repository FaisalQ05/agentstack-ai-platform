import { del, get, post } from '@/shared/api/methods';
import { ApiSuccess } from '@/shared/types/api/api.types';
import {
  IngestDocumentRequest,
  IngestDocumentResult,
  RagAskRequest,
  RagAskResult,
  RagDocumentSummary,
} from '../types/rag.types';

async function unwrap<T>(promise: Promise<ApiSuccess<T>>): Promise<T> {
  const response = await promise;
  return response.data;
}

export function listDocuments() {
  return unwrap(get<ApiSuccess<RagDocumentSummary[]>>('/rag/documents'));
}

export function ingestDocument(body: IngestDocumentRequest) {
  return unwrap(
    post<ApiSuccess<IngestDocumentResult>>('/rag/documents', body),
  );
}

export function deleteDocument(documentId: string) {
  return unwrap(
    del<ApiSuccess<{ deleted: true }>>(`/rag/documents/${documentId}`),
  );
}

export function ask(body: RagAskRequest) {
  return unwrap(post<ApiSuccess<RagAskResult>>('/rag/ask', body));
}
