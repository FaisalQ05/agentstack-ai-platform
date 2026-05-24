export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ErrorResponse;
  statusCode: number;
  path: string;
  timestamp: string;
}

export interface StandardResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  statusCode: number;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginatedResponse<T> = StandardResponse<PaginatedData<T>>;
