import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { StandardResponse } from '../types/api.types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T> | T> {
    // 🔹 Detect request type
    const type = context.getType<'http' | 'graphql'>();

    // For GraphQL, skip transformation as GraphQL schema already defines the response structure
    if (type === 'graphql') {
      return next.handle();
    }

    // Handle HTTP requests
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: request?.url ?? 'unknown',
        statusCode: response?.statusCode ?? 200,
      })),
    );
  }
}
