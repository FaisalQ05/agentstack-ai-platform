export interface AiToolMeta {
  provider: string;
  model: string;
}

export interface SummarizeRequest {
  content: string;
  maxLength?: number;
  tone?: string;
}

export interface SummarizeResponse extends AiToolMeta {
  summary: string;
}

export interface RewriteRequest {
  content: string;
  style?: 'formal' | 'casual' | 'concise' | 'friendly' | 'professional';
  instructions?: string;
}

export interface RewriteResponse extends AiToolMeta {
  rewritten: string;
}

export interface ExtractKeywordsRequest {
  content: string;
  count?: number;
}

export interface ExtractKeywordsResponse extends AiToolMeta {
  keywords: string[];
}

export interface GenerateDescriptionRequest {
  title?: string;
  content?: string;
  type?: 'product' | 'article' | 'service' | 'general';
  maxLength?: number;
}

export interface GenerateDescriptionResponse extends AiToolMeta {
  description: string;
}
