import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

// Thin wrapper so you can inject AppLogger anywhere
// with a consistent context instead of using PinoLogger directly
@Injectable()
export class AppLogger {
  constructor(
    @InjectPinoLogger(AppLogger.name)
    private readonly logger: PinoLogger,
  ) {}

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.info(meta ?? {}, message);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(meta ?? {}, message);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(meta ?? {}, message);
  }

  error(message: string, meta?: Record<string, unknown>, trace?: string) {
    this.logger.error({ ...(meta ?? {}), trace }, message);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(meta ?? {}, message);
  }

  verbose(message: string, meta?: Record<string, unknown>) {
    this.logger.trace(meta ?? {}, message);
  }
}
