import { registerAs } from '@nestjs/config';
import { databaseSchema } from './database.schema';

export default registerAs('database', () => {
  const parsed = databaseSchema.parse(process.env);

  return {
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    name: parsed.DB_NAME,
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    url: parsed.DATABASE_URL,
  };
});
