export type ApiSuccess<T> = {
  success: true;
  data: T;
  timestamp: string;
  path: string;
  statusCode: number;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  statusCode: number;
  path: string;
  timestamp: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
