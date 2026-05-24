import { chunkText } from './chunk-text.util';

describe('chunkText', () => {
  it('splits text with overlap', () => {
    const text = 'a'.repeat(100);
    const chunks = chunkText(text, { chunkSize: 40, chunkOverlap: 10 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 40)).toBe(true);
  });

  it('returns empty array for blank input', () => {
    expect(chunkText('   ', { chunkSize: 100, chunkOverlap: 0 })).toEqual([]);
  });
});
