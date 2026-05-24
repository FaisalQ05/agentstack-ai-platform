import { registerAs } from '@nestjs/config';
import { appSchema } from './app.schema';

export default registerAs('app', () => {
  const parsed = appSchema.parse(process.env);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.API_PORT,
    clientOrigin: parsed.CLIENT_ORIGIN,
  };
});
