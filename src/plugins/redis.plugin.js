import fp from 'fastify-plugin';
import Redis from 'ioredis';

/**
 * Redis plugin.
 *
 * Registers a Redis client on the Fastify instance as `fastify.redis`.
 * The client is disconnected during graceful shutdown. Connection errors
 * are logged but do not crash the process — consumers must check
 * `fastify.redis` before using it.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {{ redisUrl?: string }} [options]
 */
export const registerRedis = fp(async (fastify, options = {}) => {
  const redisUrl = options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });

  redis.on('connect', () => fastify.log.info('redis connected'));
  redis.on('error', (error) => fastify.log.error({ err: error }, 'redis error'));
  redis.on('close', () => fastify.log.warn('redis connection closed'));

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});

export default registerRedis;
