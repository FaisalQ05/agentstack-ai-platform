import { registerAs } from '@nestjs/config';
import { authSchema } from './auth.schema';

export default registerAs('auth', () => {
  const parsed = authSchema.parse(process.env);

  return {
    accessTokenSecret: parsed.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: parsed.REFRESH_TOKEN_SECRET,
    accessTokenTtl: parsed.ACCESS_TOKEN_TTL,
    refreshTokenTtl: parsed.REFRESH_TOKEN_TTL,
    saltRounds: parsed.SALT_ROUNDS,
  };
});
