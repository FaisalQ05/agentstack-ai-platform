import { get, post } from '@/shared/api/methods';
import { ApiSuccess } from '@/shared/types/api/api.types';
import {
  ChatRequest,
  ChatResponse,
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

export function fetchConversations() {
  return unwrap(get<ApiSuccess<ConversationSummary[]>>('/chat'));
}

export function fetchConversation(conversationId: string) {
  return unwrap(
    get<ApiSuccess<ConversationDetail>>(`/chat/${conversationId}`),
  );
}
