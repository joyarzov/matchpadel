import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Connected to PostgreSQL database');

    // Test Redis connection (optional)
    if (redis) {
      try {
        await redis.connect();
        console.log('Connected to Redis');
      } catch (redisError) {
        console.warn('Redis connection failed, rate limiting will use memory store:', (redisError as Error).message);
      }
    } else {
      console.warn('Redis not configured, using memory store for rate limiting');
    }

    app.listen(env.PORT, () => {
      console.log(`MatchPadel API running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  if (redis) redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  if (redis) redis.disconnect();
  process.exit(0);
});

startServer();
