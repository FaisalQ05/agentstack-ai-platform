import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Level } from 'pino';
import { TypedConfigService } from '../../config/typed-config.service';
import { AppLogger } from './logger.service';

// ── Serializer shapes ─────────────────────────────────────────────────────────
interface SerializedReq {
  method: string;
  url: string;
  ip: string | undefined;
}

interface SerializedRes {
  statusCode: number;
}

// ── Raw pino-http serializer input shapes ─────────────────────────────────────
interface RawRequest extends IncomingMessage {
  remoteAddress?: string;
  method: string;
  url: string;
}

interface RawResponse {
  statusCode: number;
}

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => {
        const isDev = config.app.nodeEnv === 'development';

        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',

            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                    singleLine: false,
                  },
                }
              : undefined,

            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.body.password',
                'req.body.confirmPassword',
                'req.body.token',
              ],
              censor: '[REDACTED]',
            },

            customLogLevel: (
              _req: IncomingMessage,
              res: ServerResponse,
              err?: Error,
            ): Level => {
              if (res.statusCode >= 500 || err != null) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },

            customSuccessMessage: (
              req: IncomingMessage,
              res: ServerResponse,
            ): string => {
              return `${req.method ?? 'UNKNOWN'} ${req.url ?? '/'} ${res.statusCode}`;
            },

            customErrorMessage: (
              req: IncomingMessage,
              res: ServerResponse,
              err: Error,
            ): string => {
              return `${req.method ?? 'UNKNOWN'} ${req.url ?? '/'} ${res.statusCode} — ${err.message}`;
            },

            serializers: {
              req: (req: RawRequest): SerializedReq => ({
                method: req.method,
                url: req.url,
                ip: req.remoteAddress,
              }),

              res: (res: RawResponse): SerializedRes => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
  ],
  providers: [AppLogger],
  exports: [PinoLoggerModule, AppLogger],
})
export class LoggerModule {}
