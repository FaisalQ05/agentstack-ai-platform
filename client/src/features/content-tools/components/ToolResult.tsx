'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { AiToolMeta } from '../types/content-tools.types';

interface ToolResultProps {
  label: string;
  value: string | string[];
  meta?: AiToolMeta | null;
  className?: string;
}

export function ToolResult({ label, value, meta, className }: ToolResultProps) {
  const [copied, setCopied] = useState(false);

  const text =
    typeof value === 'string' ? value : value.map((item) => `• ${item}`).join('\n');

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {meta ? (
            <span className="text-xs text-muted-foreground">
              {meta.provider} · {meta.model}
            </span>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => void handleCopy()}
            aria-label="Copy result"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>

      {typeof value === 'string' ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {value}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {value.map((keyword) => (
            <li
              key={keyword}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground"
            >
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
