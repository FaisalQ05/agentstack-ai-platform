import { useQuery, QueryKey } from '@tanstack/react-query';
import { get } from '../api/methods';
import { ApiResponse } from '../types/api/api.types';

export function useApiQuery<
  T,
  P extends Record<string, unknown> = Record<string, unknown>,
>(key: QueryKey, url: string, params?: P) {
  return useQuery<ApiResponse<T>>({
    queryKey: key,
    queryFn: () => get<ApiResponse<T>, P>(url, params),
  });
}
