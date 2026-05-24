'use client';

import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { inputClassName, panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';
import { Loader2, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  extractKeywords,
  generateDescription,
  rewrite,
  summarize,
} from '../api/content-tools.api';
import { AiToolMeta } from '../types/content-tools.types';
import { ToolResult } from './ToolResult';

type ToolId = 'summarize' | 'rewrite' | 'extract-keywords' | 'generate-description';
type RewriteStyle = NonNullable<
  import('../types/content-tools.types').RewriteRequest['style']
>;
type DescriptionType = NonNullable<
  import('../types/content-tools.types').GenerateDescriptionRequest['type']
>;

const TOOLS: { id: ToolId; label: string; description: string }[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Shorten long text into a clear summary',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Rephrase content in a different style',
  },
  {
    id: 'extract-keywords',
    label: 'Keywords',
    description: 'Pull key terms from any text',
  },
  {
    id: 'generate-description',
    label: 'Description',
    description: 'Generate product or article copy',
  },
];

export function ContentToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>('summarize');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<AiToolMeta | null>(null);

  // Summarize
  const [summarizeContent, setSummarizeContent] = useState('');
  const [summarizeMaxLength, setSummarizeMaxLength] = useState('150');
  const [summarizeTone, setSummarizeTone] = useState('');
  const [summary, setSummary] = useState<string | null>(null);

  // Rewrite
  const [rewriteContent, setRewriteContent] = useState('');
  const [rewriteStyle, setRewriteStyle] =
    useState<RewriteStyle>('professional');
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [rewritten, setRewritten] = useState<string | null>(null);

  // Keywords
  const [keywordsContent, setKeywordsContent] = useState('');
  const [keywordCount, setKeywordCount] = useState('10');
  const [keywords, setKeywords] = useState<string[] | null>(null);

  // Description
  const [descTitle, setDescTitle] = useState('');
  const [descContent, setDescContent] = useState('');
  const [descType, setDescType] = useState<DescriptionType>('general');
  const [descMaxLength, setDescMaxLength] = useState('300');
  const [description, setDescription] = useState<string | null>(null);

  function resetOutput() {
    setError(null);
    setMeta(null);
    setSummary(null);
    setRewritten(null);
    setKeywords(null);
    setDescription(null);
  }

  function switchTool(tool: ToolId) {
    setActiveTool(tool);
    resetOutput();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (
      activeTool === 'generate-description' &&
      !descTitle.trim() &&
      !descContent.trim()
    ) {
      setError('Provide at least a title or content.');
      setIsLoading(false);
      return;
    }

    try {
      setSummary(null);
      setRewritten(null);
      setKeywords(null);
      setDescription(null);

      switch (activeTool) {
        case 'summarize': {
          const result = await summarize({
            content: summarizeContent.trim(),
            maxLength: Number(summarizeMaxLength) || undefined,
            tone: summarizeTone.trim() || undefined,
          });
          setSummary(result.summary);
          setMeta(result);
          break;
        }
        case 'rewrite': {
          const result = await rewrite({
            content: rewriteContent.trim(),
            style: rewriteStyle,
            instructions: rewriteInstructions.trim() || undefined,
          });
          setRewritten(result.rewritten);
          setMeta(result);
          break;
        }
        case 'extract-keywords': {
          const result = await extractKeywords({
            content: keywordsContent.trim(),
            count: Number(keywordCount) || undefined,
          });
          setKeywords(result.keywords);
          setMeta(result);
          break;
        }
        case 'generate-description': {
          const result = await generateDescription({
            title: descTitle.trim() || undefined,
            content: descContent.trim() || undefined,
            type: descType,
            maxLength: Number(descMaxLength) || undefined,
          });
          setDescription(result.description);
          setMeta(result);
          break;
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Request failed'));
    } finally {
      setIsLoading(false);
    }
  }

  const activeMeta = TOOLS.find((tool) => tool.id === activeTool);

  return (
    <AppShell
      title="Content Tools"
      description="Summarize, rewrite, extract keywords, and generate descriptions"
    >
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => switchTool(tool.id)}
            className={cn(
              'rounded-xl border px-4 py-2 text-left text-sm transition-colors',
              activeTool === tool.id
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className={cn(panelClassName, 'flex flex-col gap-4 p-5')}
        >
          <div>
            <h2 className="font-semibold">{activeMeta?.label}</h2>
            <p className="text-xs text-muted-foreground">
              {activeMeta?.description}
            </p>
          </div>

          {activeTool === 'summarize' && (
            <>
              <label className="block text-xs font-medium text-muted-foreground">
                Content
                <textarea
                  required
                  value={summarizeContent}
                  onChange={(e) => setSummarizeContent(e.target.value)}
                  rows={8}
                  className={cn(inputClassName, 'mt-1 resize-y')}
                  placeholder="Paste text to summarize..."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Max length
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={summarizeMaxLength}
                    onChange={(e) => setSummarizeMaxLength(e.target.value)}
                    className={cn(inputClassName, 'mt-1')}
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Tone (optional)
                  <input
                    type="text"
                    value={summarizeTone}
                    onChange={(e) => setSummarizeTone(e.target.value)}
                    className={cn(inputClassName, 'mt-1')}
                    placeholder="e.g. professional"
                  />
                </label>
              </div>
            </>
          )}

          {activeTool === 'rewrite' && (
            <>
              <label className="block text-xs font-medium text-muted-foreground">
                Content
                <textarea
                  required
                  value={rewriteContent}
                  onChange={(e) => setRewriteContent(e.target.value)}
                  rows={8}
                  className={cn(inputClassName, 'mt-1 resize-y')}
                  placeholder="Paste text to rewrite..."
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Style
                <select
                  value={rewriteStyle}
                  onChange={(e) =>
                    setRewriteStyle(e.target.value as RewriteStyle)
                  }
                  className={cn(inputClassName, 'mt-1')}
                >
                  <option value="professional">Professional</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="concise">Concise</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Extra instructions (optional)
                <input
                  type="text"
                  value={rewriteInstructions}
                  onChange={(e) => setRewriteInstructions(e.target.value)}
                  className={cn(inputClassName, 'mt-1')}
                  placeholder="e.g. Keep technical terms"
                />
              </label>
            </>
          )}

          {activeTool === 'extract-keywords' && (
            <>
              <label className="block text-xs font-medium text-muted-foreground">
                Content
                <textarea
                  required
                  value={keywordsContent}
                  onChange={(e) => setKeywordsContent(e.target.value)}
                  rows={8}
                  className={cn(inputClassName, 'mt-1 resize-y')}
                  placeholder="Paste text to analyze..."
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Number of keywords
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={keywordCount}
                  onChange={(e) => setKeywordCount(e.target.value)}
                  className={cn(inputClassName, 'mt-1 max-w-[120px]')}
                />
              </label>
            </>
          )}

          {activeTool === 'generate-description' && (
            <>
              <label className="block text-xs font-medium text-muted-foreground">
                Title (optional)
                <input
                  type="text"
                  value={descTitle}
                  onChange={(e) => setDescTitle(e.target.value)}
                  className={cn(inputClassName, 'mt-1')}
                  placeholder="e.g. Wireless Headphones"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Content (optional)
                <textarea
                  value={descContent}
                  onChange={(e) => setDescContent(e.target.value)}
                  rows={5}
                  className={cn(inputClassName, 'mt-1 resize-y')}
                  placeholder="Features, specs, or article excerpt..."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Type
                  <select
                    value={descType}
                    onChange={(e) =>
                      setDescType(e.target.value as DescriptionType)
                    }
                    className={cn(inputClassName, 'mt-1')}
                  >
                    <option value="general">General</option>
                    <option value="product">Product</option>
                    <option value="article">Article</option>
                    <option value="service">Service</option>
                  </select>
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Max length
                  <input
                    type="number"
                    min={50}
                    max={2000}
                    value={descMaxLength}
                    onChange={(e) => setDescMaxLength(e.target.value)}
                    className={cn(inputClassName, 'mt-1')}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Provide at least a title or content.
              </p>
            </>
          )}

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles />
                Run {activeMeta?.label}
              </>
            )}
          </Button>
        </form>

        <div className="flex min-h-[320px] flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Output</h3>

          {!summary && !rewritten && !keywords && !description && !isLoading ? (
            <div
              className={cn(
                panelClassName,
                'flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground',
              )}
            >
              Run a tool to see results here.
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Calling AI provider...
            </div>
          ) : null}

          {summary ? (
            <ToolResult label="Summary" value={summary} meta={meta} />
          ) : null}
          {rewritten ? (
            <ToolResult label="Rewritten" value={rewritten} meta={meta} />
          ) : null}
          {keywords ? (
            <ToolResult label="Keywords" value={keywords} meta={meta} />
          ) : null}
          {description ? (
            <ToolResult label="Description" value={description} meta={meta} />
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
