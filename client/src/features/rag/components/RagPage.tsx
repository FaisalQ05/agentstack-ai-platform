'use client';

import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { inputClassName, panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';
import {
  BookOpen,
  Database,
  FileText,
  Loader2,
  MessageCircleQuestion,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  ask as askRag,
  deleteDocument,
  ingestDocument,
  listDocuments,
} from '../api/rag.api';
import {
  SAMPLE_RAG_CONTENT,
  SAMPLE_RAG_TITLE,
} from '../samples/rag.samples';
import {
  RagAskResult,
  RagDocumentSummary,
} from '../types/rag.types';
import { RetrievedChunksPanel } from './RetrievedChunksPanel';

type TabId = 'ingest' | 'ask';

export function RagPage() {
  const [tab, setTab] = useState<TabId>('ingest');
  const [documents, setDocuments] = useState<RagDocumentSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Ingest
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [content, setContent] = useState('');
  const [chunkSize, setChunkSize] = useState('800');
  const [chunkOverlap, setChunkOverlap] = useState('100');
  const [lastIngest, setLastIngest] = useState<{
    chunkCount: number;
    embeddingModel: string;
  } | null>(null);

  // Ask
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState('5');
  const [scopeDocumentId, setScopeDocumentId] = useState('');
  const [askResult, setAskResult] = useState<RagAskResult | null>(null);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load documents'));
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  async function handleIngest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setLastIngest(null);

    try {
      const result = await ingestDocument({
        title: title.trim(),
        content: content.trim(),
        source: source.trim() || undefined,
        chunkSize: Number(chunkSize) || undefined,
        chunkOverlap: Number(chunkOverlap) || undefined,
      });
      setLastIngest({
        chunkCount: result.chunkCount,
        embeddingModel: result.embeddingModel,
      });
      setScopeDocumentId(result.documentId);
      await refreshDocuments();
      setTab('ask');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to index document'));
    } finally {
      setBusy(false);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setAskResult(null);

    try {
      const result = await askRag({
        question: question.trim(),
        topK: Number(topK) || undefined,
        documentId: scopeDocumentId || undefined,
      });
      setAskResult(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to get answer'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(documentId: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteDocument(documentId);
      if (scopeDocumentId === documentId) setScopeDocumentId('');
      await refreshDocuments();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete document'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      wide
      title="RAG Knowledge Base"
      description="Chunk → embed → pgvector search → grounded answers"
    >
      <div className="rag-hero mb-6 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Database className="size-3.5" />
              PostgreSQL + pgvector · local ONNX embeddings (OpenAI/Groq fallback)
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Retrieval-Augmented Generation
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Index private text as vector chunks, then ask questions. Embeddings
              use the local Python service by default (OpenAI and Groq as
              fallbacks). Set <code className="text-foreground">LOCAL_EMBEDDING_URL</code>{' '}
              and optional <code className="text-foreground">AI_EMBEDDING_API_KEY</code> in
              server/.env.
            </p>
          </div>
          <ol className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-5 lg:max-w-xl">
            {[
              'Question',
              'Embed',
              'Search',
              'Top-K',
              'Answer',
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2 py-1.5"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(240px,280px)_1fr]">
        <aside className={cn(panelClassName, 'flex flex-col p-4')}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4 text-primary" />
            Indexed documents
          </h3>

          {loadingDocs ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet. Ingest sample content to get started.
            </p>
          ) : (
            <ul className="max-h-[420px] space-y-2 overflow-y-auto">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className={cn(
                    'rounded-xl border p-3 transition-colors',
                    scopeDocumentId === doc.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      setScopeDocumentId(doc.id);
                      setTab('ask');
                    }}
                  >
                    <p className="text-sm font-medium leading-tight">
                      {doc.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doc.chunkCount} chunks
                      {doc.source ? ` · ${doc.source}` : ''}
                    </p>
                  </button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="mt-2 h-7 text-destructive hover:text-destructive"
                    disabled={busy}
                    onClick={() => void handleDelete(doc.id)}
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            disabled={loadingDocs}
            onClick={() => void refreshDocuments()}
          >
            Refresh list
          </Button>
        </aside>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <TabButton
              active={tab === 'ingest'}
              onClick={() => setTab('ingest')}
              icon={Upload}
              label="Index document"
            />
            <TabButton
              active={tab === 'ask'}
              onClick={() => setTab('ask')}
              icon={MessageCircleQuestion}
              label="Ask question"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {tab === 'ingest' ? (
            <form
              onSubmit={(e) => void handleIngest(e)}
              className={cn(panelClassName, 'flex flex-col gap-4 p-5 md:p-6')}
            >
              <div>
                <h2 className="text-lg font-semibold">Index new content</h2>
                <p className="text-sm text-muted-foreground">
                  Text is chunked, embedded, and stored in pgvector. The LLM
                  never sees the full document.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTitle(SAMPLE_RAG_TITLE);
                    setContent(SAMPLE_RAG_CONTENT);
                    setSource('sample');
                  }}
                >
                  <FileText className="size-3.5" />
                  Load sample
                </Button>
              </div>

              <label className="block text-xs font-medium text-muted-foreground">
                Title
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(inputClassName, 'mt-1.5')}
                  placeholder="Document title"
                />
              </label>

              <label className="block text-xs font-medium text-muted-foreground">
                Source (optional)
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className={cn(inputClassName, 'mt-1.5')}
                  placeholder="e.g. handbook, wiki"
                />
              </label>

              <label className="block text-xs font-medium text-muted-foreground">
                Content
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className={cn(inputClassName, 'mt-1.5 resize-y font-mono text-xs')}
                  placeholder="Paste text to index…"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Chunk size
                  <input
                    type="number"
                    min={100}
                    max={8000}
                    value={chunkSize}
                    onChange={(e) => setChunkSize(e.target.value)}
                    className={cn(inputClassName, 'mt-1.5')}
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Chunk overlap
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(e.target.value)}
                    className={cn(inputClassName, 'mt-1.5')}
                  />
                </label>
              </div>

              {lastIngest ? (
                <p className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  Indexed {lastIngest.chunkCount} chunks with{' '}
                  <code className="text-xs">{lastIngest.embeddingModel}</code>.
                  Switch to Ask to query this knowledge base.
                </p>
              ) : null}

              <Button type="submit" disabled={busy} size="lg" className="w-fit">
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Embedding…
                  </>
                ) : (
                  <>
                    <Database />
                    Index into pgvector
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                onSubmit={(e) => void handleAsk(e)}
                className={cn(panelClassName, 'flex flex-col gap-4 p-5 md:p-6')}
              >
                <div>
                  <h2 className="text-lg font-semibold">Ask a question</h2>
                  <p className="text-sm text-muted-foreground">
                    Answers use only retrieved chunks. Missing info → &quot;I
                    don&apos;t know&quot;.
                  </p>
                </div>

                <label className="block text-xs font-medium text-muted-foreground">
                  Scope
                  <select
                    value={scopeDocumentId}
                    onChange={(e) => setScopeDocumentId(e.target.value)}
                    className={cn(inputClassName, 'mt-1.5')}
                  >
                    <option value="">All indexed documents</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.chunkCount} chunks)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-medium text-muted-foreground">
                  Question
                  <textarea
                    required
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                    className={cn(inputClassName, 'mt-1.5 resize-y')}
                    placeholder="e.g. What is the Enterprise refund policy?"
                  />
                </label>

                <label className="block text-xs font-medium text-muted-foreground">
                  Top-K chunks
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                    className={cn(inputClassName, 'mt-1.5 max-w-[120px]')}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    'What are the pricing tiers?',
                    'Is SOC 2 supported?',
                    'What are EU data residency options?',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                      onClick={() => setQuestion(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <Button type="submit" disabled={busy} size="lg" className="w-fit">
                  {busy ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Searching & generating…
                    </>
                  ) : (
                    <>
                      <Search />
                      Ask with RAG
                    </>
                  )}
                </Button>
              </form>

              <div className="flex flex-col gap-4">
                {!askResult && !busy ? (
                  <div
                    className={cn(
                      panelClassName,
                      'flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground',
                    )}
                  >
                    Run a question to see the grounded answer and retrieved
                    chunks.
                  </div>
                ) : null}

                {busy ? (
                  <div
                    className={cn(
                      panelClassName,
                      'flex flex-1 flex-col items-center justify-center gap-3 p-12',
                    )}
                  >
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Embedding question → pgvector search → LLM…
                    </p>
                  </div>
                ) : null}

                {askResult && !busy ? (
                  <>
                    <div className={cn(panelClassName, 'p-5')}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Grounded answer
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {askResult.provider} · {askResult.model}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {askResult.answer}
                      </p>
                    </div>
                    <RetrievedChunksPanel chunks={askResult.chunks} />
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Upload;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors',
        active
          ? 'border-primary bg-primary/10 font-medium text-foreground'
          : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
