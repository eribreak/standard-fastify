import fp from 'fastify-plugin';
import Redis from 'ioredis';

const MAX_CONNECT_RETRIES = 5;

/**
 * Redis plugin.
 *
 * Registers a Redis client on the Fastify instance as `fastify.redis`.
 * The client is disconnected during graceful shutdown.
 *
 * Resilience policy:
 * - Connection errors are logged but never crash the process.
 * - `enableOfflineQueue: false` makes commands fail fast when Redis is not
 *   connected, so callers (cache service) degrade gracefully instead of
 *   waiting for retry backoff.
 * - Initial connection is attempted with a bounded number of retries so a
 *   missing Redis does not produce endless log spam.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {{ redisUrl?: string }} [options]
 */
export const registerRedis = fp(async (fastify, options = {}) => {
  const redisUrl = options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

  const redis = new Redis(redisUrl, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > MAX_CONNECT_RETRIES) {
        return null; // stop retrying — cache layer stays disabled
      }
      return Math.min(times * 100, 1000);
    },
  });

  redis.on('connect', () => fastify.log.info('redis connected'));
  redis.on('ready', () => fastify.log.info('redis ready'));
  redis.on('error', (error) => fastify.log.warn({ err: error }, 'redis error'));
  redis.on('close', () => fastify.log.warn('redis connection closed'));
  redis.on('end', () => fastify.log.warn('redis connection ended (retries exhausted)'));

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit().catch(() => redis.disconnect());
  });
});

export default registerRedis;
