'use client';

import { Button } from '@/components/ui/button';
import { panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { AiToolRecordMeta } from '../types/ai-tools.types';

interface JsonResultPanelProps {
  label: string;
  data: unknown;
  meta?: AiToolRecordMeta | null;
  recordId?: string;
  className?: string;
}

export function JsonResultPanel({
  label,
  data,
  meta,
  recordId,
  className,
}: JsonResultPanelProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  async function handleCopy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn(panelClassName, 'p-4', className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {recordId ? <span>id: {recordId}</span> : null}
          {meta ? (
            <span>
              {meta.provider} · {meta.model}
            </span>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => void handleCopy()}
            aria-label="Copy JSON"
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>
      <pre className="max-h-96 overflow-auto rounded-xl bg-muted/60 p-3 text-xs text-foreground">
        {json}
      </pre>
    </div>
  );
}
