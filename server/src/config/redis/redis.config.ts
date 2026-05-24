import { registerAs } from '@nestjs/config';
import { redisSchema } from './redis.schema';

export default registerAs('redis', () => {
  const parsed = redisSchema.parse(process.env);

  return {
    host: parsed.REDIS_HOST,
    port: parsed.REDIS_PORT,
  };
});
