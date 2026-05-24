import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
