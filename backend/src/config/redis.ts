import Redis from 'ioredis';
import { env } from './env';

const redisUrl = env.REDIS_URL;
const isRedisConfigured = redisUrl && redisUrl !== 'redis://localhost:6379' && redisUrl !== '';

export let redis: Redis | null = null;

if (isRedisConfigured) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  } catch {
    console.warn('Redis not available, using memory store for rate limiting');
    redis = null;
  }
} else {
  console.log('Redis not configured, using memory store for rate limiting');
}

export default redis;
