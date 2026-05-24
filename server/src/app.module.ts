import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypedConfigModule } from './config/config.module';
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai/ai.config';
import appConfig from './config/app/app.config';
import databaseConfig from './config/database/database.config';
import ragConfig from './config/rag/rag.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ChatModule } from './chat/chat.module';
import { ContentToolsModule } from './content-tools/content-tools.module';
import { AiToolsModule } from './ai-tools/ai-tools.module';
import { StructuredAiModule } from './ai/structured/structured-ai.module';
import { PrismaModule } from './prisma/prisma.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      load: [appConfig, databaseConfig, aiConfig, ragConfig],
    }),
    TypedConfigModule,
    LoggerModule,
    PrismaModule,
    StructuredAiModule,
    ChatModule,
    ContentToolsModule,
    AiToolsModule,
    RagModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
