import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

function createRedisStore(prefix: string) {
  if (!redis) return undefined;
  try {
    return new RedisStore({
      sendCommand: (...args: string[]) => redis!.call(args[0], ...args.slice(1)) as Promise<any>,
      prefix,
    });
  } catch {
    console.warn(`Failed to create Redis store for ${prefix}, using memory store`);
    return undefined;
  }
}

export const generalLimiter = rateLimit({
  store: createRedisStore('rl:general:'),
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas solicitudes, intenta de nuevo en un minuto',
  },
});

export const loginLimiter = rateLimit({
  store: createRedisStore('rl:login:'),
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiados intentos de login, intenta de nuevo en un minuto',
  },
});
