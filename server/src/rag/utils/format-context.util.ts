import { RetrievedChunk } from '../interfaces/rag.interfaces';

export function formatContextForPrompt(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] (similarity: ${chunk.similarity.toFixed(3)})\n${chunk.content}`,
    )
    .join('\n\n');
}

export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
