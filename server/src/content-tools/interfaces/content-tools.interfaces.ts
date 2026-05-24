export interface AiToolMeta {
  provider: string;
  model: string;
}

export interface SummarizeResult extends AiToolMeta {
  summary: string;
}

export interface RewriteResult extends AiToolMeta {
  rewritten: string;
}

export interface ExtractKeywordsResult extends AiToolMeta {
  keywords: string[];
}

export interface GenerateDescriptionResult extends AiToolMeta {
  description: string;
}
