export interface ChunkTextOptions {
  chunkSize: number;
  chunkOverlap: number;
}

/**
 * Splits text into overlapping chunks without sending full documents to the LLM.
 */
export function chunkText(
  text: string,
  options: ChunkTextOptions,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const { chunkSize, chunkOverlap } = options;
  const overlap = Math.min(chunkOverlap, Math.max(0, chunkSize - 1));

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const slice = normalized.slice(start, end).trim();

    if (slice.length > 0) {
      chunks.push(slice);
    }

    if (end >= normalized.length) break;
    start = end - overlap;
    if (start <= 0 && end > 0) start = end;
  }

  return chunks;
}
