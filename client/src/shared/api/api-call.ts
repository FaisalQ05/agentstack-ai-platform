import { AxiosRequestConfig, AxiosError } from 'axios';
import { api } from './axios';
import { ApiError } from '../types/api/api.types';

export async function apiCall<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? err;
  }
}
