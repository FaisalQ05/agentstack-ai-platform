export type SseHandler = {
  onEvent: (event: string, data: unknown) => void;
  onError?: (error: Error) => void;
};

function parseSseChunk(
  chunk: string,
  buffer: string,
  handler: SseHandler,
): string {
  const combined = buffer + chunk;
  const parts = combined.split('\n\n');
  const remainder = parts.pop() ?? '';

  for (const part of parts) {
    if (!part.trim()) continue;

    let event = 'message';
    const dataLines: string[] = [];

    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length === 0) continue;

    try {
      const data: unknown = JSON.parse(dataLines.join('\n'));
      handler.onEvent(event, data);
    } catch {
      handler.onError?.(new Error('Failed to parse SSE payload'));
    }
  }

  return remainder;
}

export async function postSse(
  url: string,
  body: unknown,
  handler: SseHandler,
  init?: RequestInit,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const json = (await response.json()) as {
        error?: { message?: string };
      };
      if (json.error?.message) message = json.error.message;
    } catch {
      // ignore
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('Streaming is not supported in this browser');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer = parseSseChunk(decoder.decode(value, { stream: true }), buffer, handler);
  }

  if (buffer.trim()) {
    parseSseChunk('\n\n', buffer, handler);
  }
}
