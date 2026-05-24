'use client';

import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { inputClassName, panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';
import { Loader2, MessageSquarePlus, Send, Sparkles } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  fetchConversation,
  fetchConversations,
  streamChatMessage,
} from '../api/chat.api';
import { ChatMessage, ConversationSummary } from '../types/chat.types';

const STREAMING_ID = 'streaming-assistant';

export function ChatPage() {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful assistant. Be concise and practical.',
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMeta, setActiveMeta] = useState<{
    provider: string;
    model: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const items = await fetchConversations();
        if (cancelled) return;

        setConversations(items);

        if (items.length > 0) {
          await loadConversation(items[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load conversations'));
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function loadConversation(conversationId: string) {
    setError(null);
    setActiveConversationId(conversationId);

    const conversation = await fetchConversation(conversationId);
    setMessages(
      conversation.messages.filter((message) => message.role !== 'system'),
    );
    setSystemPrompt(
      conversation.systemPrompt ??
        'You are a helpful assistant. Be concise and practical.',
    );
  }

  function startNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setActiveMeta(null);
    setError(null);
  }

  function appendStreamingToken(delta: string) {
    setMessages((current) => {
      const existing = current.find((m) => m.id === STREAMING_ID);

      if (existing) {
        return current.map((m) =>
          m.id === STREAMING_ID ? { ...m, content: m.content + delta } : m,
        );
      }

      return [
        ...current,
        {
          id: STREAMING_ID,
          role: 'assistant',
          content: delta,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }

  function finalizeStreamingMessage(message: ChatMessage) {
    setMessages((current) =>
      current.map((m) => (m.id === STREAMING_ID ? message : m)),
    );
  }

  function removeStreamingPlaceholder() {
    setMessages((current) => current.filter((m) => m.id !== STREAMING_ID));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const optimisticMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setInput('');
    setError(null);
    setIsLoading(true);
    setMessages((current) => [...current, optimisticMessage]);

    try {
      let streamFailed: Error | null = null;

      await streamChatMessage(
        {
          message: trimmed,
          conversationId: activeConversationId ?? undefined,
          system: systemPrompt.trim() || undefined,
        },
        {
          onMeta: (meta) => {
            setActiveConversationId(meta.conversationId);
            setActiveMeta({ provider: meta.provider, model: meta.model });
          },
          onToken: appendStreamingToken,
          onDone: async (response) => {
            finalizeStreamingMessage(response.message);
            setActiveConversationId(response.conversationId);
            setActiveMeta({
              provider: response.provider,
              model: response.model,
            });
            const refreshed = await fetchConversations();
            setConversations(refreshed);
          },
          onError: (streamError) => {
            streamFailed = new Error(streamError.message);
          },
        },
      );

      if (streamFailed) {
        throw streamFailed;
      }
    } catch (err) {
      removeStreamingPlaceholder();
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id),
      );
      setError(getApiErrorMessage(err, 'Failed to send message'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell
      title="AI Chat"
      description="Streaming responses via Server-Sent Events (SSE)"
    >
      <div className="flex h-[calc(100vh-8.5rem)] min-h-[480px] gap-4">
        <aside
          className={cn(
            panelClassName,
            'hidden w-72 shrink-0 flex-col p-4 md:flex',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Conversations
            </h2>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={startNewConversation}
              aria-label="New conversation"
            >
              <MessageSquarePlus />
            </Button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No conversations yet.
              </p>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => void loadConversation(conversation.id)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                    activeConversationId === conversation.id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-transparent text-foreground hover:bg-muted',
                  )}
                >
                  <p className="truncate font-medium">
                    {conversation.title ?? 'Untitled chat'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className={cn(panelClassName, 'flex min-w-0 flex-1 flex-col')}>
          <header className="border-b border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    Conversation
                  </h2>
                </div>
                {activeMeta ? (
                  <p className="text-xs text-muted-foreground">
                    {activeMeta.provider} · {activeMeta.model} · SSE stream
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Tokens stream in real time
                  </p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="md:hidden"
                onClick={startNewConversation}
              >
                <MessageSquarePlus />
                New
              </Button>
            </div>

            <label className="block text-xs font-medium text-muted-foreground">
              System prompt
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={2}
                className={cn(inputClassName, 'mt-1 resize-none')}
                placeholder="Define how the assistant should behave..."
              />
            </label>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {isBootstrapping ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading conversations...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquarePlus className="mb-3 size-8 opacity-60" />
                <p className="text-sm text-foreground">
                  Start a conversation with your AI assistant.
                </p>
                <p className="mt-1 text-xs">
                  Responses stream token-by-token over SSE.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'border border-border bg-muted text-foreground',
                    message.id === STREAMING_ID && isLoading && 'animate-pulse',
                  )}
                >
                  <p
                    className={cn(
                      'mb-1 text-[11px] font-semibold uppercase tracking-wide',
                      message.role === 'user'
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground',
                    )}
                  >
                    {message.role}
                    {message.id === STREAMING_ID && isLoading ? ' · streaming' : ''}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </article>
              ))
            )}

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="border-t border-border p-4"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                placeholder="Ask anything..."
                className={cn(inputClassName, 'min-h-12 flex-1 resize-none')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                Send
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
