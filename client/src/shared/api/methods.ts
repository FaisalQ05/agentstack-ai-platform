import { apiCall } from './api-call';

export function get<
  T,
  P extends Record<string, unknown> = Record<string, unknown>,
>(url: string, params?: P) {
  return apiCall<T>({ url, method: 'GET', params });
}

export function post<T, B = unknown>(url: string, body?: B) {
  return apiCall<T>({ url, method: 'POST', data: body });
}

export function put<T, B = unknown>(url: string, body?: B) {
  return apiCall<T>({ url, method: 'PUT', data: body });
}

export function del<T>(url: string) {
  return apiCall<T>({ url, method: 'DELETE' });
}
