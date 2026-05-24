import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { APIError } from 'openai';
import { ApiErrorResponse } from '../types/api.types';
import { AppLogger } from '../logger/logger.service';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientInitializationError,
} from '@prisma/client/runtime/client';

// ─── Prisma error code → HTTP status map ─────────────────────────────────────
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2000: { status: HttpStatus.BAD_REQUEST, message: 'Input value too long' },
  P2001: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'Unique constraint violation',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Foreign key constraint violation',
  },
  P2004: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Database constraint violation',
  },
  P2011: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Null constraint violation',
  },
  P2012: { status: HttpStatus.BAD_REQUEST, message: 'Missing required value' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: AppLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const path: string = request?.url ?? 'unknown';
    const timestamp = new Date().toISOString();

    const response = this.buildResponse(exception, path, timestamp);

    this.logger.error(response.error.message, {
      statusCode: response.statusCode,
      path,
      code: response.error.code,
      trace: exception instanceof Error ? exception.stack : undefined,
    });

    httpAdapter.reply(ctx.getResponse(), response, response.statusCode);
  }

  // ─── Main dispatcher ──────────────────────────────────────────────────────
  private buildResponse(
    exception: unknown,
    path: string,
    timestamp: string,
  ): ApiErrorResponse {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, path, timestamp);
    }

    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(exception, path, timestamp);
    }

    if (exception instanceof PrismaClientValidationError) {
      return {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        path,
        timestamp,
        error: {
          code: 'PRISMA_VALIDATION_ERROR',
          message: 'Invalid query parameters',
        },
      };
    }

    if (exception instanceof PrismaClientInitializationError) {
      return {
        success: false,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        path,
        timestamp,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database connection failed',
        },
      };
    }

    if (exception instanceof APIError) {
      return this.handleAiProviderError(exception, path, timestamp);
    }

    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path,
      timestamp,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }

  // ─── HttpException (includes class-validator via ValidationPipe) ──────────
  private handleHttpException(
    exception: HttpException,
    path: string,
    timestamp: string,
  ): ApiErrorResponse {
    const statusCode = exception.getStatus();
    const res: string | object = exception.getResponse();

    // class-validator errors arrive as { message: string[], error: string }
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const body = res as Record<string, unknown>;
      const messages: string[] = Array.isArray(body.message)
        ? (body.message as string[])
        : [String(body.message)];

      return {
        success: false,
        statusCode,
        path,
        timestamp,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: messages,
        },
      };
    }

    return {
      success: false,
      statusCode,
      path,
      timestamp,
      error: {
        code: exception.name.toUpperCase().replace(/ /g, '_'),
        message: exception.message,
      },
    };
  }

  // ─── Prisma known request errors (P2xxx) ──────────────────────────────────
  private handleAiProviderError(
    exception: APIError,
    path: string,
    timestamp: string,
  ): ApiErrorResponse {
    const statusCode =
      exception.status === 429
        ? HttpStatus.TOO_MANY_REQUESTS
        : exception.status === 401
          ? HttpStatus.UNAUTHORIZED
          : HttpStatus.BAD_GATEWAY;

    const code =
      exception.status === 429
        ? 'AI_QUOTA_EXCEEDED'
        : exception.status === 401
          ? 'AI_AUTH_ERROR'
          : 'AI_PROVIDER_ERROR';

    return {
      success: false,
      statusCode,
      path,
      timestamp,
      error: {
        code,
        message: exception.message,
      },
    };
  }

  // ─── Prisma known request errors (P2xxx) ──────────────────────────────────
  private handlePrismaKnownError(
    exception: PrismaClientKnownRequestError,
    path: string,
    timestamp: string,
  ): ApiErrorResponse {
    const raw = exception as unknown as {
      code: string;
      meta: Record<string, unknown> | undefined;
    };
    const code: string = raw.code;
    const meta: Record<string, unknown> | undefined = raw.meta;

    // P2002 — surface which field caused the conflict
    if (code === 'P2002') {
      const target = meta?.target;
      const fields = Array.isArray(target)
        ? (target as string[]).join(', ')
        : 'field';

      return {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        path,
        timestamp,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `${fields} already exists`,
        },
      };
    }

    const mapped = PRISMA_ERROR_MAP[code];
    return {
      success: false,
      statusCode: mapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      path,
      timestamp,
      error: {
        code: `PRISMA_${code}`,
        message: mapped?.message ?? 'Database error',
      },
    };
  }
}
