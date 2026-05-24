import { BadRequestException, Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import {
  ExtractKeywordsDto,
  GenerateDescriptionDto,
  RewriteDto,
  SummarizeDto,
} from './dto/content-tools.dto';
import {
  AiToolMeta,
  ExtractKeywordsResult,
  GenerateDescriptionResult,
  RewriteResult,
  SummarizeResult,
} from './interfaces/content-tools.interfaces';

@Injectable()
export class ContentToolsService {
  constructor(private readonly aiService: AiService) {}

  async summarize(dto: SummarizeDto): Promise<SummarizeResult> {
    const maxLength = dto.maxLength ?? 150;
    const tone = dto.tone ? ` Use a ${dto.tone} tone.` : '';

    const { content, ...meta } = await this.complete(
      `You are a summarization assistant. Produce a clear, accurate summary.${tone} ` +
        `Keep the summary under ${maxLength} characters. Return only the summary text.`,
      dto.content,
    );

    return { summary: content, ...meta };
  }

  async rewrite(dto: RewriteDto): Promise<RewriteResult> {
    const style = dto.style ?? 'professional';
    const extra = dto.instructions
      ? ` Additional instructions: ${dto.instructions}`
      : '';

    const { content, ...meta } = await this.complete(
      `You are a writing assistant. Rewrite the user's text in a ${style} style.` +
        ` Preserve the original meaning.${extra} Return only the rewritten text.`,
      dto.content,
    );

    return { rewritten: content, ...meta };
  }

  async extractKeywords(
    dto: ExtractKeywordsDto,
  ): Promise<ExtractKeywordsResult> {
    const count = dto.count ?? 10;

    const { content, ...meta } = await this.complete(
      `You are a keyword extraction assistant. Extract exactly ${count} relevant keywords or key phrases ` +
        `from the user's text. Respond with ONLY a valid JSON array of strings, e.g. ["keyword1","keyword2"]. ` +
        `No markdown, no explanation.`,
      dto.content,
    );

    const keywords = this.parseKeywordList(content, count);

    return { keywords, ...meta };
  }

  async generateDescription(
    dto: GenerateDescriptionDto,
  ): Promise<GenerateDescriptionResult> {
    if (!dto.title?.trim() && !dto.content?.trim()) {
      throw new BadRequestException(
        'At least one of title or content is required',
      );
    }

    const type = dto.type ?? 'general';
    const maxLength = dto.maxLength ?? 300;

    const input = [
      dto.title?.trim() ? `Title: ${dto.title.trim()}` : null,
      dto.content?.trim() ? `Content:\n${dto.content.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const { content, ...meta } = await this.complete(
      `You are a copywriter. Write a compelling ${type} description based on the input. ` +
        `Keep it under ${maxLength} characters. Return only the description text.`,
      input,
    );

    return { description: content, ...meta };
  }

  private async complete(
    systemPrompt: string,
    userContent: string,
  ): Promise<{ content: string } & AiToolMeta> {
    const result = await this.aiService.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    return {
      content: result.content,
      provider: result.provider,
      model: result.model,
    };
  }

  private parseKeywordList(raw: string, maxCount: number): string[] {
    const trimmed = raw.trim();

    try {
      const parsed: unknown = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, maxCount);
      }
    } catch {
      // fall through to line/comma split
    }

    const fallback = trimmed
      .replace(/^\[|\]$/g, '')
      .split(/[,;\n]+/)
      .map((item) => item.replace(/^["']|["']$/g, '').trim())
      .filter(Boolean)
      .slice(0, maxCount);

    if (fallback.length === 0) {
      throw new BadRequestException(
        'Could not parse keywords from AI response',
      );
    }

    return fallback;
  }
}
