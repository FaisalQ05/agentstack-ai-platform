import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole } from '../../generated/prisma/client';
import { AiService } from '../ai/ai.service';
import { AiChatMessage } from '../ai/interfaces/ai-provider.interface';
import { TypedConfigService } from '../config/typed-config.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  ConversationDetailDto,
  ConversationSummaryDto,
} from './dto/chat.dto';

export interface ChatPreparedContext {
  conversationId: string;
  aiMessages: AiChatMessage[];
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly config: TypedConfigService,
  ) {}

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const prepared = await this.prepareChat(dto);
    const completion = await this.aiService.complete({
      messages: prepared.aiMessages,
    });

    const assistantMessage = await this.saveAssistantMessage(
      prepared.conversationId,
      completion.content,
    );

    return {
      conversationId: prepared.conversationId,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
      provider: completion.provider,
      model: completion.model,
    };
  }

  async prepareChat(dto: ChatRequestDto): Promise<ChatPreparedContext> {
    console.log('PREPARING CHAT');
    console.log({ dto });

    // Find or create conversation
    const conversation = dto.conversationId
      ? await this.findConversation(dto.conversationId)
      : await this.createConversation(dto.system);

    console.log({ conversation });

    if (
      dto.conversationId &&
      dto.system &&
      dto.system !== conversation.systemPrompt
    ) {
      console.log('Updating system prompt');
      // Update system prompt if it's different
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { systemPrompt: dto.system },
      });
      conversation.systemPrompt = dto.system;
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.user,
        content: dto.message,
      },
    });

    if (!conversation.title) {
      console.log('Updating conversation title');
      // Update conversation title if it's empty
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: this.buildTitle(dto.message) },
      });
    }

    // Fetch history
    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    console.log({ history });

    return {
      conversationId: conversation.id,
      aiMessages: this.buildAiMessages(conversation.systemPrompt, history),
    };
  }

  streamCompletion(aiMessages: AiChatMessage[]): AsyncGenerator<string> {
    return this.aiService.streamComplete({ messages: aiMessages });
  }

  async saveAssistantMessage(conversationId: string, content: string) {
    const trimmed = content.trim();

    if (!trimmed) {
      throw new Error('AI returned an empty response');
    }

    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.assistant,
        content: trimmed,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return assistantMessage;
  }

  getStreamMeta() {
    return {
      provider: this.aiService.activeProvider,
      model: this.config.ai.model,
    };
  }

  listConversations(): Promise<ConversationSummaryDto[]> {
    return this.prisma.conversation
      .findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          systemPrompt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .then((conversations) =>
        conversations.map((conversation) => ({
          ...conversation,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
        })),
      );
  }

  async getConversation(id: string): Promise<ConversationDetailDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    return {
      id: conversation.id,
      title: conversation.title,
      systemPrompt: conversation.systemPrompt,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  private async findConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    return conversation;
  }

  private createConversation(systemPrompt?: string) {
    return this.prisma.conversation.create({
      data: {
        systemPrompt: systemPrompt?.trim() || null,
      },
    });
  }

  private buildTitle(message: string): string {
    const trimmed = message.trim();
    return trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57)}...`;
  }

  private buildAiMessages(
    systemPrompt: string | null,
    history: Array<{ role: MessageRole; content: string }>,
  ): AiChatMessage[] {
    const messages: AiChatMessage[] = [];

    console.log('Building AI messages');

    if (systemPrompt?.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() });
    }

    for (const message of history) {
      if (message.role === MessageRole.system) {
        continue;
      }

      messages.push({
        role: message.role,
        content: message.content,
      });
    }

    return messages;
  }
}
