'use client';

import { panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Database } from 'lucide-react';
import { RetrievedChunk } from '../types/rag.types';

interface RetrievedChunksPanelProps {
  chunks: RetrievedChunk[];
}

export function RetrievedChunksPanel({ chunks }: RetrievedChunksPanelProps) {
  if (chunks.length === 0) {
    return (
      <div
        className={cn(
          panelClassName,
          'p-4 text-sm text-muted-foreground',
        )}
      >
        No chunks retrieved — the model answered without vector context.
      </div>
    );
  }

  const maxSimilarity = Math.max(...chunks.map((c) => c.similarity), 0.01);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Database className="size-3.5" />
        Retrieved chunks (pgvector top-K)
      </div>
      {chunks.map((chunk, index) => (
        <article
          key={chunk.id}
          className={cn(panelClassName, 'overflow-hidden')}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2">
            <span className="text-xs font-medium text-foreground">
              [{index + 1}] {chunk.documentTitle} · chunk #{chunk.chunkIndex}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
              {(chunk.similarity * 100).toFixed(1)}%
            </span>
          </div>
          <div className="px-4 py-2">
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(chunk.similarity / maxSimilarity) * 100}%`,
                }}
              />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {chunk.content}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
