import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { TypedConfigService } from './config/typed-config.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ── Pino as NestJS logger ───────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  const config = app.get(TypedConfigService);

  // ── Global prefix ───────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Filters ─────────────────────────────────────────────────────────────
  // app.useGlobalFilters(app.get(AllExceptionsFilter));

  // // ── Interceptors ─────────────────────────────────────────────────────────
  // app.useGlobalInterceptors(
  //   app.get(LoggingInterceptor),
  //   new TransformInterceptor(),
  // );

  // ── CORS ────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: config.app.clientOrigin,
    credentials: true,
  });

  // ── Shutdown hooks ──────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = config.app.port;
  await app.listen(port);
}
bootstrap().catch(console.error);
