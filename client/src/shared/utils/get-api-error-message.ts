import { ApiError } from '@/shared/types/api/api.types';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error?.message === 'string'
  ) {
    return (error as ApiError).error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
