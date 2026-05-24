import { useMutation } from '@tanstack/react-query';
import { ApiError, ApiResponse } from '../types/api/api.types';

export function useApiMutation<TData, TBody = unknown>(
  mutationFn: (body: TBody) => Promise<ApiResponse<TData>>
) {
  return useMutation<ApiResponse<TData>, ApiError, TBody>({
    mutationFn,
  });
}
