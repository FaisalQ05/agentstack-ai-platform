export interface RetryOptions {
  maxAttempts: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_SHOULD_RETRY = (): boolean => true;

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxAttempts, delayMs = 300, shouldRetry = DEFAULT_SHOULD_RETRY } =
    options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error)) {
        break;
      }
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
