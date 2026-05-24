import { Injectable } from '@nestjs/common';
import {
  CV_PARSER_JSON_SCHEMA,
  CvParserOutput,
  cvParserOutputSchema,
  normalizeCvParserOutput,
} from '../../ai/structured/schemas/cv-parser.schema';
import { StructuredAiService } from '../../ai/structured/structured-ai.service';
import { CV_PARSER_SYSTEM_PROMPT } from '../prompts/structured.prompts';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CvParserService {
  constructor(
    private readonly structuredAi: StructuredAiService,
    private readonly prisma: PrismaService,
  ) {}

  async parse(rawText: string): Promise<{
    id: string;
    result: CvParserOutput;
    model: string;
    provider: string;
  }> {
    console.log('Parsing CV');
    console.log({ rawText });
    const { data, model, provider } = await this.structuredAi.generate({
      schemaName: 'cv_parser_output',
      jsonSchema: CV_PARSER_JSON_SCHEMA,
      zodSchema: cvParserOutputSchema,
      systemPrompt: CV_PARSER_SYSTEM_PROMPT,
      userPrompt: rawText.trim(),
    });

    console.log({ data });

    const result = normalizeCvParserOutput(data);

    console.log({ result });

    const record = await this.prisma.parsedCv.create({
      data: {
        rawText: rawText.trim(),
        result: result,
        model,
        provider,
      },
    });

    return { id: record.id, result, model, provider };
  }

  async findById(id: string): Promise<CvParserOutput> {
    const record = await this.prisma.parsedCv.findUniqueOrThrow({
      where: { id },
    });

    return normalizeCvParserOutput(cvParserOutputSchema.parse(record.result));
  }
}
