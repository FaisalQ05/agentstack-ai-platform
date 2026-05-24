'use client';

import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { inputClassName, panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';
import { Briefcase, FileText, FileUser, GitCompare, Loader2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  extractJob,
  matchJobByIds,
  parseCv,
} from '../api/ai-tools.api';
import {
  ExtractJobResponse,
  MatchJobResponse,
  ParseCvResponse,
} from '../types/ai-tools.types';
import { CvResultView } from './CvResultView';
import { JobResultView } from './JobResultView';
import { JsonResultPanel } from './JsonResultPanel';
import { MatchResultView } from './MatchResultView';
import {
  SAMPLE_CV_TEXT,
  SAMPLE_JOB_POSTING_TEXT,
} from '../samples/ai-tools.samples';

type ToolId = 'cv-parse' | 'job-extract' | 'job-match';

const TOOLS: { id: ToolId; label: string; icon: typeof FileUser }[] = [
  { id: 'cv-parse', label: 'CV Parser', icon: FileUser },
  { id: 'job-extract', label: 'Job Extractor', icon: Briefcase },
  { id: 'job-match', label: 'Job Matcher', icon: GitCompare },
];

export function AiToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>('cv-parse');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');

  const [cvRecord, setCvRecord] = useState<ParseCvResponse | null>(null);
  const [jobRecord, setJobRecord] = useState<ExtractJobResponse | null>(null);
  const [matchRecord, setMatchRecord] = useState<MatchJobResponse | null>(null);

  const [matchCvId, setMatchCvId] = useState('');
  const [matchJobId, setMatchJobId] = useState('');

  function switchTool(tool: ToolId) {
    setActiveTool(tool);
    setError(null);
  }

  async function handleParseCv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cvText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await parseCv(cvText);
      setCvRecord(response);
      setMatchCvId(response.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'CV parsing failed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExtractJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!jobText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await extractJob(jobText);
      setJobRecord(response);
      setMatchJobId(response.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Job extraction failed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cvId = matchCvId.trim() || cvRecord?.id;
    const jobId = matchJobId.trim() || jobRecord?.id;

    if (!cvId || !jobId) {
      setError('Parse a CV and extract a job first, or provide both IDs.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await matchJobByIds({ cvId, jobId });
      setMatchRecord(response);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Job matching failed'));
    } finally {
      setIsLoading(false);
    }
  }

  const activeMeta = TOOLS.find((t) => t.id === activeTool);

  return (
    <AppShell
      title="Structured AI Tools"
      description="JSON-only outputs validated with Zod — CV parse, job extract, job match"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => switchTool(tool.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors',
              activeTool === tool.id
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <tool.icon className="size-4" />
            {tool.label}
          </button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => setShowJson((v) => !v)}
        >
          {showJson ? 'Formatted view' : 'JSON view'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            if (activeTool === 'cv-parse') void handleParseCv(event);
            else if (activeTool === 'job-extract') void handleExtractJob(event);
            else void handleMatch(event);
          }}
          className={cn(panelClassName, 'flex flex-col gap-4 p-5')}
        >
          <div>
            <h2 className="font-semibold text-foreground">{activeMeta?.label}</h2>
            <p className="text-xs text-muted-foreground">
              Structured JSON output via your configured AI provider
            </p>
          </div>

          {activeTool === 'cv-parse' && (
            <SampleTextareaField
              label="Raw CV text"
              value={cvText}
              onChange={setCvText}
              onLoadSample={() => setCvText(SAMPLE_CV_TEXT)}
              placeholder="Paste CV text here, or load the sample résumé..."
            />
          )}

          {activeTool === 'job-extract' && (
            <SampleTextareaField
              label="Job posting text"
              value={jobText}
              onChange={setJobText}
              onLoadSample={() => setJobText(SAMPLE_JOB_POSTING_TEXT)}
              placeholder="Paste a job description, or load the sample posting..."
            />
          )}

          {activeTool === 'job-match' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Match using saved record IDs from parse/extract steps, or enter
                IDs manually.
              </p>
              <label className="block text-xs font-medium text-muted-foreground">
                CV record ID
                <input
                  type="text"
                  value={matchCvId}
                  onChange={(e) => setMatchCvId(e.target.value)}
                  placeholder={cvRecord?.id ?? 'uuid from CV parse'}
                  className={cn(inputClassName, 'mt-1 font-mono text-xs')}
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Job record ID
                <input
                  type="text"
                  value={matchJobId}
                  onChange={(e) => setMatchJobId(e.target.value)}
                  placeholder={jobRecord?.id ?? 'uuid from job extract'}
                  className={cn(inputClassName, 'mt-1 font-mono text-xs')}
                />
              </label>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>Session state:</p>
                <p>CV: {cvRecord ? `✓ ${cvRecord.id}` : '— not parsed yet'}</p>
                <p>Job: {jobRecord ? `✓ ${jobRecord.id}` : '— not extracted yet'}</p>
              </div>
            </div>
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
              <>Run {activeMeta?.label}</>
            )}
          </Button>
        </form>

        <div className="flex min-h-[360px] flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Output</h3>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Validating structured JSON...
            </div>
          ) : null}

          {!isLoading && activeTool === 'cv-parse' && !cvRecord ? (
            <EmptyState message="Parse a CV to see structured results." />
          ) : null}

          {!isLoading && activeTool === 'job-extract' && !jobRecord ? (
            <EmptyState message="Extract a job posting to see structured results." />
          ) : null}

          {!isLoading && activeTool === 'job-match' && !matchRecord ? (
            <EmptyState message="Run a match after parsing CV and job data." />
          ) : null}

          {!isLoading && activeTool === 'cv-parse' && cvRecord ? (
            showJson ? (
              <JsonResultPanel
                label="Parsed CV (JSON)"
                data={cvRecord.result}
                meta={cvRecord}
                recordId={cvRecord.id}
              />
            ) : (
              <CvResultView cv={cvRecord.result} />
            )
          ) : null}

          {!isLoading && activeTool === 'job-extract' && jobRecord ? (
            showJson ? (
              <JsonResultPanel
                label="Extracted job (JSON)"
                data={jobRecord.result}
                meta={jobRecord}
                recordId={jobRecord.id}
              />
            ) : (
              <JobResultView job={jobRecord.result} />
            )
          ) : null}

          {!isLoading && activeTool === 'job-match' && matchRecord ? (
            showJson ? (
              <JsonResultPanel
                label="Match result (JSON)"
                data={matchRecord.result}
                meta={matchRecord}
                recordId={matchRecord.id}
              />
            ) : (
              <MatchResultView match={matchRecord.result} />
            )
          ) : null}
        </div>
      </div>

      {(cvRecord || jobRecord) && activeTool !== 'job-match' ? (
        <p className="text-center text-xs text-muted-foreground">
          Parsed records are saved for matching — open the Job Matcher tab when
          ready.
        </p>
      ) : null}
    </AppShell>
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
  onChange: (value: string) => void;
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
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
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
        Sample data is designed to work with the Job Matcher after parse and extract.
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className={cn(
        panelClassName,
        'flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground',
      )}
    >
      {message}
    </div>
  );
}
