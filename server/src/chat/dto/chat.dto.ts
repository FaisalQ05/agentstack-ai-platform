import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsString()
  system?: string;
}

export class ChatMessageDto {
  id!: string;
  role!: 'system' | 'user' | 'assistant';
  content!: string;
  createdAt!: string;
}

export class ChatResponseDto {
  conversationId!: string;
  message!: ChatMessageDto;
  provider!: string;
  model!: string;
}

export class ConversationSummaryDto {
  id!: string;
  title!: string | null;
  systemPrompt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class ConversationDetailDto extends ConversationSummaryDto {
  messages!: ChatMessageDto[];
}
