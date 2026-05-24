'use client';

import { Button } from '@/components/ui/button';
import { AppNav } from '@/components/layout/AppNav';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  fetchConversation,
  fetchConversations,
  sendChatMessage,
} from '../api/chat.api';
import { ChatMessage, ConversationSummary } from '../types/chat.types';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';

interface ChatPageProps {
  initialConversations?: ConversationSummary[];
}

export function ChatPage({ initialConversations = [] }: ChatPageProps) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
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
          setError(
            getApiErrorMessage(err, 'Failed to load conversations'),
          );
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
      const response = await sendChatMessage({
        message: trimmed,
        conversationId: activeConversationId ?? undefined,
        system: systemPrompt.trim() || undefined,
      });

      setActiveConversationId(response.conversationId);
      setActiveMeta({ provider: response.provider, model: response.model });
      setMessages((current) => [...current, response.message]);

      const refreshed = await fetchConversations();
      setConversations(refreshed);
    } catch (err) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id),
      );
      setError(getApiErrorMessage(err, 'Failed to send message'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-6xl flex-col gap-3 p-4">
      <AppNav />
      <div className="flex min-h-0 flex-1 gap-4">
      <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border border-border bg-card/80 p-4 shadow-sm md:flex">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">AI Chat</h1>
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
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void loadConversation(conversation.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                  activeConversationId === conversation.id
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted',
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

      <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-border bg-card/80 shadow-sm">
        <header className="border-b border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Conversation</h2>
              {activeMeta ? (
                <p className="text-xs text-muted-foreground">
                  {activeMeta.provider} · {activeMeta.model}
                </p>
              ) : null}
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
              className="mt-1 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              <p className="text-sm">Start a conversation with your AI assistant.</p>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                  {message.role}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </article>
            ))
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Thinking...
            </div>
          ) : null}

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
              className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
    </div>
  );
}
