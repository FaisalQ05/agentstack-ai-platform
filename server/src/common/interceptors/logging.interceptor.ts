import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info(`${method} ${url}`, {
            method,
            url,
            ip,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
          });
        },
        error: (err: Error) => {
          this.logger.error(
            `${method} ${url} — ${err.message}`,
            {
              method,
              url,
              ip,
              durationMs: Date.now() - start,
            },
            err.stack,
          );
        },
      }),
    );
  }
}
