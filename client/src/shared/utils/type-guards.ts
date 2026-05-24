import { ApiError } from '@/shared/types/api/api.types';

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ApiError).success === false
  );
}
