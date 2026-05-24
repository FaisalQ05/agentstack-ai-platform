import { APIError } from 'openai';
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { initSse, writeSseEvent } from '../common/utils/sse.util';
import { ChatService } from './chat.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  ConversationDetailDto,
  ConversationSummaryDto,
} from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  sendMessage(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.chat(dto);
  }

  @Post('stream')
  async streamMessage(
    @Body() dto: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    initSse(res);

    try {
      const prepared = await this.chatService.prepareChat(dto);
      const meta = this.chatService.getStreamMeta();

      writeSseEvent(res, 'meta', {
        conversationId: prepared.conversationId,
        provider: meta.provider,
        model: meta.model,
      });

      let fullContent = '';

      for await (const delta of this.chatService.streamCompletion(
        prepared.aiMessages,
      )) {
        fullContent += delta;
        writeSseEvent(res, 'token', { delta });
      }

      const assistantMessage = await this.chatService.saveAssistantMessage(
        prepared.conversationId,
        fullContent,
      );

      writeSseEvent(res, 'done', {
        conversationId: prepared.conversationId,
        message: {
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
        provider: meta.provider,
        model: meta.model,
      });
    } catch (error) {
      const message =
        error instanceof APIError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Stream failed';

      const code =
        error instanceof APIError && error.status === 429
          ? 'AI_QUOTA_EXCEEDED'
          : 'STREAM_ERROR';

      writeSseEvent(res, 'error', { code, message });
    } finally {
      res.end();
    }
  }

  @Get()
  listConversations(): Promise<ConversationSummaryDto[]> {
    return this.chatService.listConversations();
  }

  @Get(':conversationId')
  getConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<ConversationDetailDto> {
    return this.chatService.getConversation(conversationId);
  }
}
