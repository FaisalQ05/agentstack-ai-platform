'use client';

import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import {
  extractJob,
  matchJobByIds,
  parseCv,
} from '@/features/ai-tools/api/ai-tools.api';
import { CvResultView } from '@/features/ai-tools/components/CvResultView';
import { JobResultView } from '@/features/ai-tools/components/JobResultView';
import { JsonResultPanel } from '@/features/ai-tools/components/JsonResultPanel';
import { MatchResultView } from '@/features/ai-tools/components/MatchResultView';
import {
  SAMPLE_CV_TEXT,
  SAMPLE_JOB_POSTING_TEXT,
} from '@/features/ai-tools/samples/ai-tools.samples';
import {
  ExtractJobResponse,
  MatchJobResponse,
  ParseCvResponse,
} from '@/features/ai-tools/types/ai-tools.types';
import {
  extractKeywords,
  generateDescription,
  rewrite,
  summarize,
} from '@/features/content-tools/api/content-tools.api';
import { ToolResult } from '@/features/content-tools/components/ToolResult';
import { AiToolMeta } from '@/features/content-tools/types/content-tools.types';
import { inputClassName, panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';
import {
  ArrowRight,
  Braces,
  FileText,
  Loader2,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { getTool, ToolId } from '../config/tools-registry';
import { ToolSidebar } from './ToolSidebar';

type RewriteStyle = NonNullable<
  import('@/features/content-tools/types/content-tools.types').RewriteRequest['style']
>;
type DescriptionType = NonNullable<
  import('@/features/content-tools/types/content-tools.types').GenerateDescriptionRequest['type']
>;

export function UnifiedToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>('summarize');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Content tool state
  const [meta, setMeta] = useState<AiToolMeta | null>(null);
  const [summarizeContent, setSummarizeContent] = useState('');
  const [summarizeMaxLength, setSummarizeMaxLength] = useState('150');
  const [summarizeTone, setSummarizeTone] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [rewriteContent, setRewriteContent] = useState('');
  const [rewriteStyle, setRewriteStyle] =
    useState<RewriteStyle>('professional');
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [rewritten, setRewritten] = useState<string | null>(null);
  const [keywordsContent, setKeywordsContent] = useState('');
  const [keywordCount, setKeywordCount] = useState('10');
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [descTitle, setDescTitle] = useState('');
  const [descContent, setDescContent] = useState('');
  const [descType, setDescType] = useState<DescriptionType>('general');
  const [descMaxLength, setDescMaxLength] = useState('300');
  const [description, setDescription] = useState<string | null>(null);

  // Structured tool state
  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');
  const [cvRecord, setCvRecord] = useState<ParseCvResponse | null>(null);
  const [jobRecord, setJobRecord] = useState<ExtractJobResponse | null>(null);
  const [matchRecord, setMatchRecord] = useState<MatchJobResponse | null>(null);
  const [matchCvId, setMatchCvId] = useState('');
  const [matchJobId, setMatchJobId] = useState('');

  const tool = getTool(activeTool);
  const isStructured = tool.category === 'structured';

  function selectTool(id: ToolId) {
    setActiveTool(id);
    setError(null);
  }

  function clearContentOutput() {
    setMeta(null);
    setSummary(null);
    setRewritten(null);
    setKeywords(null);
    setDescription(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      switch (activeTool) {
        case 'summarize': {
          clearContentOutput();
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
          clearContentOutput();
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
          clearContentOutput();
          const result = await extractKeywords({
            content: keywordsContent.trim(),
            count: Number(keywordCount) || undefined,
          });
          setKeywords(result.keywords);
          setMeta(result);
          break;
        }
        case 'generate-description': {
          if (!descTitle.trim() && !descContent.trim()) {
            setError('Provide at least a title or content.');
            return;
          }
          clearContentOutput();
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
        case 'cv-parse': {
          if (!cvText.trim()) return;
          const response = await parseCv(cvText);
          setCvRecord(response);
          setMatchCvId(response.id);
          break;
        }
        case 'job-extract': {
          if (!jobText.trim()) return;
          const response = await extractJob(jobText);
          setJobRecord(response);
          setMatchJobId(response.id);
          break;
        }
        case 'job-match': {
          const cvId = matchCvId.trim() || cvRecord?.id;
          const jobId = matchJobId.trim() || jobRecord?.id;
          if (!cvId || !jobId) {
            setError(
              'Parse a CV and extract a job first, or provide both record IDs.',
            );
            return;
          }
          const response = await matchJobByIds({ cvId, jobId });
          setMatchRecord(response);
          break;
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Request failed'));
    } finally {
      setIsLoading(false);
    }
  }

  const hasActiveContentOutput =
    (activeTool === 'summarize' && summary !== null) ||
    (activeTool === 'rewrite' && rewritten !== null) ||
    (activeTool === 'extract-keywords' && keywords !== null) ||
    (activeTool === 'generate-description' && description !== null);

  const hasActiveStructuredOutput =
    (activeTool === 'cv-parse' && cvRecord !== null) ||
    (activeTool === 'job-extract' && jobRecord !== null) ||
    (activeTool === 'job-match' && matchRecord !== null);

  const showEmptyOutput =
    !isLoading && !hasActiveContentOutput && tool.category === 'content';

  const showStructuredEmpty =
    !isLoading && !hasActiveStructuredOutput && isStructured;

  return (
    <AppShell
      wide
      title="AI Tools"
      description="All content and structured tools in one workspace"
    >
      <div className="tools-hero mb-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Provider-agnostic · OpenAI & Groq
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              One workspace for every AI tool
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pick a tool from the sidebar, run it, and see results instantly.
              Structured tools chain together — parse a CV, extract a job, then
              match.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <PipelineChip
              done={!!cvRecord}
              label="CV parsed"
              onClick={() => selectTool('cv-parse')}
            />
            <ArrowRight className="hidden size-4 self-center text-muted-foreground sm:block" />
            <PipelineChip
              done={!!jobRecord}
              label="Job extracted"
              onClick={() => selectTool('job-extract')}
            />
            <ArrowRight className="hidden size-4 self-center text-muted-foreground sm:block" />
            <PipelineChip
              done={!!matchRecord}
              label="Matched"
              onClick={() => selectTool('job-match')}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(220px,260px)_1fr]">
        <div className={cn(panelClassName, 'p-3 lg:p-4')}>
          <ToolSidebar activeTool={activeTool} onSelect={selectTool} />
        </div>

        <div className="grid min-h-[520px] gap-6 xl:grid-cols-2">
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className={cn(panelClassName, 'flex flex-col gap-4 p-5 md:p-6')}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <tool.icon className="size-4" />
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tool.category}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {tool.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              {isStructured ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowJson((v) => !v)}
                >
                  <Braces className="size-3.5" />
                  {showJson ? 'Formatted' : 'JSON'}
                </Button>
              ) : null}
            </div>

            {renderFormFields()}

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-auto w-full sm:w-auto"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Sparkles />
                  Run {tool.label}
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Output</h3>
            <div className="flex min-h-[400px] flex-1 flex-col">
              {isLoading ? (
                <OutputLoading structured={isStructured} />
              ) : null}

              {showEmptyOutput ? (
                <OutputEmpty message="Run a tool to see results here." />
              ) : null}

              {showStructuredEmpty ? (
                <OutputEmpty
                  message={
                    activeTool === 'job-match'
                      ? 'Run a match after parsing a CV and extracting a job.'
                      : `Run ${tool.label} to see structured results.`
                  }
                />
              ) : null}

              {renderOutput()}
            </div>
          </div>
        </div>
      </div>

      {cvRecord || jobRecord ? (
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Workflow className="size-3.5" />
          Parsed records are saved — use Job Matcher when both steps are done.
        </p>
      ) : null}
    </AppShell>
  );

  function renderFormFields() {
    switch (activeTool) {
      case 'summarize':
        return (
          <>
            <TextareaField
              label="Content"
              value={summarizeContent}
              onChange={setSummarizeContent}
              rows={10}
              placeholder="Paste text to summarize…"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label="Max length"
                value={summarizeMaxLength}
                onChange={setSummarizeMaxLength}
                min={1}
                max={2000}
              />
              <TextField
                label="Tone (optional)"
                value={summarizeTone}
                onChange={setSummarizeTone}
                placeholder="e.g. professional"
              />
            </div>
          </>
        );
      case 'rewrite':
        return (
          <>
            <TextareaField
              label="Content"
              value={rewriteContent}
              onChange={setRewriteContent}
              rows={10}
              placeholder="Paste text to rewrite…"
              required
            />
            <SelectField
              label="Style"
              value={rewriteStyle}
              onChange={(v) => setRewriteStyle(v as RewriteStyle)}
              options={[
                { value: 'professional', label: 'Professional' },
                { value: 'formal', label: 'Formal' },
                { value: 'casual', label: 'Casual' },
                { value: 'friendly', label: 'Friendly' },
                { value: 'concise', label: 'Concise' },
              ]}
            />
            <TextField
              label="Extra instructions (optional)"
              value={rewriteInstructions}
              onChange={setRewriteInstructions}
              placeholder="e.g. Keep technical terms"
            />
          </>
        );
      case 'extract-keywords':
        return (
          <>
            <TextareaField
              label="Content"
              value={keywordsContent}
              onChange={setKeywordsContent}
              rows={10}
              placeholder="Paste text to analyze…"
              required
            />
            <NumberField
              label="Number of keywords"
              value={keywordCount}
              onChange={setKeywordCount}
              min={1}
              max={50}
              className="max-w-[140px]"
            />
          </>
        );
      case 'generate-description':
        return (
          <>
            <TextField
              label="Title (optional)"
              value={descTitle}
              onChange={setDescTitle}
              placeholder="e.g. Wireless Headphones"
            />
            <TextareaField
              label="Content (optional)"
              value={descContent}
              onChange={setDescContent}
              rows={5}
              placeholder="Features, specs, or article excerpt…"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label="Type"
                value={descType}
                onChange={(v) => setDescType(v as DescriptionType)}
                options={[
                  { value: 'general', label: 'General' },
                  { value: 'product', label: 'Product' },
                  { value: 'article', label: 'Article' },
                  { value: 'service', label: 'Service' },
                ]}
              />
              <NumberField
                label="Max length"
                value={descMaxLength}
                onChange={setDescMaxLength}
                min={50}
                max={2000}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Provide at least a title or content.
            </p>
          </>
        );
      case 'cv-parse':
        return (
          <SampleTextareaField
            label="Raw CV text"
            value={cvText}
            onChange={setCvText}
            onLoadSample={() => setCvText(SAMPLE_CV_TEXT)}
            placeholder="Paste CV text here, or load the sample résumé…"
          />
        );
      case 'job-extract':
        return (
          <SampleTextareaField
            label="Job posting text"
            value={jobText}
            onChange={setJobText}
            onLoadSample={() => setJobText(SAMPLE_JOB_POSTING_TEXT)}
            placeholder="Paste a job description, or load the sample posting…"
          />
        );
      case 'job-match':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Match using saved record IDs from parse/extract, or enter IDs
              manually.
            </p>
            <TextField
              label="CV record ID"
              value={matchCvId}
              onChange={setMatchCvId}
              placeholder={cvRecord?.id ?? 'uuid from CV parse'}
              mono
            />
            <TextField
              label="Job record ID"
              value={matchJobId}
              onChange={setMatchJobId}
              placeholder={jobRecord?.id ?? 'uuid from job extract'}
              mono
            />
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">Session state</p>
              <p>CV: {cvRecord ? `✓ ${cvRecord.id}` : '— not parsed yet'}</p>
              <p>Job: {jobRecord ? `✓ ${jobRecord.id}` : '— not extracted yet'}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function renderOutput() {
    if (isLoading) return null;

    if (activeTool === 'summarize' && summary) {
      return <ToolResult label="Summary" value={summary} meta={meta} />;
    }
    if (activeTool === 'rewrite' && rewritten) {
      return <ToolResult label="Rewritten" value={rewritten} meta={meta} />;
    }
    if (activeTool === 'extract-keywords' && keywords) {
      return <ToolResult label="Keywords" value={keywords} meta={meta} />;
    }
    if (activeTool === 'generate-description' && description) {
      return (
        <ToolResult label="Description" value={description} meta={meta} />
      );
    }

    if (activeTool === 'cv-parse' && cvRecord) {
      return showJson ? (
        <JsonResultPanel
          label="Parsed CV (JSON)"
          data={cvRecord.result}
          meta={cvRecord}
          recordId={cvRecord.id}
        />
      ) : (
        <CvResultView cv={cvRecord.result} />
      );
    }

    if (activeTool === 'job-extract' && jobRecord) {
      return showJson ? (
        <JsonResultPanel
          label="Extracted job (JSON)"
          data={jobRecord.result}
          meta={jobRecord}
          recordId={jobRecord.id}
        />
      ) : (
        <JobResultView job={jobRecord.result} />
      );
    }

    if (activeTool === 'job-match' && matchRecord) {
      return showJson ? (
        <JsonResultPanel
          label="Match result (JSON)"
          data={matchRecord.result}
          meta={matchRecord}
          recordId={matchRecord.id}
        />
      ) : (
        <MatchResultView match={matchRecord.result} />
      );
    }

    return null;
  }
}

function PipelineChip({
  done,
  label,
  onClick,
}: {
  done: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3 py-2 text-left text-xs transition-colors',
        done
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'mb-1 block size-2 rounded-full',
          done ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      />
      {label}
    </button>
  );
}

function OutputLoading({ structured }: { structured: boolean }) {
  return (
    <div
      className={cn(
        panelClassName,
        'flex flex-1 flex-col items-center justify-center gap-3 p-12 text-sm text-muted-foreground',
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p>{structured ? 'Validating structured JSON…' : 'Calling AI provider…'}</p>
    </div>
  );
}

function OutputEmpty({ message }: { message: string }) {
  return (
    <div
      className={cn(
        panelClassName,
        'flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground',
      )}
    >
      {message}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 8,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn(inputClassName, 'mt-1.5 resize-y')}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          inputClassName,
          'mt-1.5',
          mono && 'font-mono text-xs',
        )}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <label
      className={cn('block text-xs font-medium text-muted-foreground', className)}
    >
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClassName, 'mt-1.5')}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClassName, 'mt-1.5')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SampleTextareaField({
  label,
  value,
  onChange,
  onLoadSample,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onLoadSample: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={onLoadSample}
        >
          <FileText className="size-3.5" />
          Load sample
        </Button>
      </div>
      <textarea
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        className={cn(inputClassName, 'resize-y font-mono text-xs')}
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">
        Sample data works with the Job Matcher after parse and extract.
      </p>
    </div>
  );
}
