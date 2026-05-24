import { env } from '@/config/env';
import { get, post } from '@/shared/api/methods';
import { postSse } from '@/shared/utils/sse-client';
import { ApiSuccess } from '@/shared/types/api/api.types';
import {
  ChatRequest,
  ChatResponse,
  ChatStreamError,
  ChatStreamHandlers,
  ChatStreamMeta,
  ConversationDetail,
  ConversationSummary,
} from '../types/chat.types';

async function unwrap<T>(promise: Promise<ApiSuccess<T>>): Promise<T> {
  const response = await promise;
  return response.data;
}

export function sendChatMessage(body: ChatRequest) {
  return unwrap(post<ApiSuccess<ChatResponse>>('/chat', body));
}

export function streamChatMessage(
  body: ChatRequest,
  handlers: ChatStreamHandlers,
): Promise<void> {
  return postSse(`${env.NEXT_PUBLIC_API_URL}/api/v1/chat/stream`, body, {
    onEvent: (event, data) => {
      switch (event) {
        case 'meta':
          handlers.onMeta?.(data as ChatStreamMeta);
          break;
        case 'token':
          handlers.onToken?.((data as { delta: string }).delta);
          break;
        case 'done':
          handlers.onDone?.(data as ChatResponse);
          break;
        case 'error':
          handlers.onError?.(data as ChatStreamError);
          break;
        default:
          break;
      }
    },
    onError: (error) => {
      handlers.onError?.({ code: 'STREAM_ERROR', message: error.message });
    },
  });
}

export function fetchConversations() {
  return unwrap(get<ApiSuccess<ConversationSummary[]>>('/chat'));
}

export function fetchConversation(conversationId: string) {
  return unwrap(
    get<ApiSuccess<ConversationDetail>>(`/chat/${conversationId}`),
  );
}
