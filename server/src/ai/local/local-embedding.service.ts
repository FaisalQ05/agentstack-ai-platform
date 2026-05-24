import { Injectable } from '@nestjs/common';
import { withRetry } from '../../common/utils/retry.util';
import { TypedConfigService } from '../../config/typed-config.service';

interface LocalEmbedResponse {
  embedding: number[];
  model?: string;
  dimensions?: number;
}

interface LocalEmbedBatchResponse {
  embeddings: number[][];
  model?: string;
  dimensions?: number;
}

@Injectable()
export class LocalEmbeddingService {
  constructor(private readonly config: TypedConfigService) {}

  private get baseUrl(): string {
    return this.config.ai.localEmbeddingUrl.replace(/\/$/, '');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Cannot embed empty text');
    }

    const { maxAttempts, timeoutMs } = this.config.ai.localEmbedding;

    return withRetry(
      () => this.postEmbed(trimmed, timeoutMs),
      {
        maxAttempts,
        shouldRetry: (error) => this.isRetryable(error),
      },
    );
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const trimmed = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (trimmed.length === 0) return [];
    if (trimmed.length === 1) {
      return [await this.generateEmbedding(trimmed[0])];
    }

    const { maxAttempts, timeoutMs } = this.config.ai.localEmbedding;

    return withRetry(
      () => this.postEmbedBatch(trimmed, timeoutMs),
      {
        maxAttempts,
        shouldRetry: (error) => this.isRetryable(error),
      },
    );
  }

  private async postEmbedBatch(
    texts: string[],
    timeoutMs: number,
  ): Promise<number[][]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/embed/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => response.statusText);
        throw new Error(
          `Local embedding service error ${response.status}: ${detail}`,
        );
      }

      const data = (await response.json()) as LocalEmbedBatchResponse;

      if (
        !Array.isArray(data.embeddings) ||
        data.embeddings.length !== texts.length
      ) {
        throw new Error('Local embedding batch returned an unexpected shape');
      }

      for (const vector of data.embeddings) {
        if (!Array.isArray(vector) || vector.length === 0) {
          throw new Error('Local embedding batch returned an empty vector');
        }
      }

      return data.embeddings;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Local embedding batch timed out after ${timeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async postEmbed(text: string, timeoutMs: number): Promise<number[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => response.statusText);
        throw new Error(
          `Local embedding service error ${response.status}: ${detail}`,
        );
      }

      const data = (await response.json()) as LocalEmbedResponse;

      if (!Array.isArray(data.embedding) || data.embedding.length === 0) {
        throw new Error('Local embedding service returned an empty vector');
      }

      return data.embedding;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Local embedding request timed out after ${timeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRetryable(error: unknown): boolean {
    if (!(error instanceof Error)) return true;
    const msg = error.message.toLowerCase();
    return (
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('econnrefused') ||
      msg.includes('fetch failed') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('504')
    );
  }
}
