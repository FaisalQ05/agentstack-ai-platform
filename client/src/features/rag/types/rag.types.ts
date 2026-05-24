export interface RetrievedChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  chunkIndex: number;
  similarity: number;
}

export interface IngestDocumentRequest {
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, unknown>;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface IngestDocumentResult {
  documentId: string;
  title: string;
  chunkCount: number;
  embeddingModel: string;
  embeddingProvider: string;
}

export interface RagAskRequest {
  question: string;
  topK?: number;
  documentId?: string;
}

export interface RagAskResult {
  answer: string;
  question: string;
  chunks: RetrievedChunk[];
  model: string;
  provider: string;
}

export interface RagDocumentSummary {
  id: string;
  title: string;
  source: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}
