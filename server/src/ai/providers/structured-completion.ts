import OpenAI from 'openai';
import {
  AiStructuredGenerateOptions,
  AiStructuredGenerateResult,
} from '../interfaces/ai-provider.interface';

export async function executeStructuredCompletion(
  client: OpenAI,
  providerName: string,
  defaultModel: string,
  options: AiStructuredGenerateOptions,
): Promise<AiStructuredGenerateResult> {
  const model = options.model ?? defaultModel;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: options.systemPrompt },
      { role: 'user', content: options.userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: options.schema.name,
        strict: true,
        schema: options.schema.jsonSchema,
      },
    },
  });

  const content = response.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error(`${providerName} returned an empty structured response`);
  }

  return {
    content,
    model,
    provider: providerName,
  };
}

export async function executeStructuredCompletionJsonObject(
  client: OpenAI,
  providerName: string,
  defaultModel: string,
  options: AiStructuredGenerateOptions,
): Promise<AiStructuredGenerateResult> {
  const model = options.model ?? defaultModel;
  const schemaInstruction = `Respond with a single JSON object that strictly conforms to this JSON Schema (no markdown, no extra keys):\n${JSON.stringify(options.schema.jsonSchema)}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `${options.systemPrompt}\n\n${schemaInstruction}`,
      },
      { role: 'user', content: options.userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content?.trim();

  console.log({ content });

  if (!content) {
    throw new Error(`${providerName} returned an empty structured response`);
  }

  return {
    content,
    model,
    provider: providerName,
  };
}
