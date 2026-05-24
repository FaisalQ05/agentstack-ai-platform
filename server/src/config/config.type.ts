import { ConfigType } from '@nestjs/config';
import aiConfig from './ai/ai.config';
import appConfig from './app/app.config';
import authConfig from './auth/auth.config';
import databaseConfig from './database/database.config';
import redisConfig from './redis/redis.config';
import ragConfig from './rag/rag.config';

export type AllConfig = {
  app: ConfigType<typeof appConfig>;
  database: ConfigType<typeof databaseConfig>;
  auth: ConfigType<typeof authConfig>;
  redis: ConfigType<typeof redisConfig>;
  ai: ConfigType<typeof aiConfig>;
  rag: ConfigType<typeof ragConfig>;
};
