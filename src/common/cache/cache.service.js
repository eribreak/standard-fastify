/**
 * Cache service.
 *
 * A thin wrapper around the Redis client registered as `fastify.redis`.
 * Every operation is a no-op when Redis is unavailable, so the application
 * degrades gracefully to direct database access instead of crashing.
 *
 * @typedef {Object} CacheOptions
 * @property {number} [ttl] TTL in seconds. Default 60.
 */

const DEFAULT_TTL = 60;

/**
 * Get a cached value, parsing it as JSON.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} key
 * @returns {Promise<unknown|null>}
 */
export async function cacheGet(fastify, key) {
  if (!fastify.redis) {
    return null;
  }
  try {
    const raw = await fastify.redis.get(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    fastify.log.warn({ err: error, key }, 'cache get failed');
    return null;
  }
}

/**
 * Set a cached value, serializing it as JSON.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} key
 * @param {unknown} value
 * @param {CacheOptions} [options]
 * @returns {Promise<boolean>}
 */
export async function cacheSet(fastify, key, value, options = {}) {
  if (!fastify.redis) {
    return false;
  }
  const ttl = options.ttl ?? DEFAULT_TTL;
  try {
    await fastify.redis.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    fastify.log.warn({ err: error, key }, 'cache set failed');
    return false;
  }
}

/**
 * Delete one or more cached keys.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string[]} keys
 * @returns {Promise<number>} number of keys deleted
 */
export async function cacheDel(fastify, keys) {
  if (!fastify.redis) {
    return 0;
  }
  try {
    return await fastify.redis.del(keys);
  } catch (error) {
    fastify.log.warn({ err: error, keys }, 'cache delete failed');
    return 0;
  }
}

/**
 * Remember a value: return the cached value if present, otherwise run the
 * factory, cache the result, and return it.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} key
 * @param {() => Promise<unknown>} factory
 * @param {CacheOptions} [options]
 * @returns {Promise<unknown>}
 */
export async function cacheRemember(fastify, key, factory, options = {}) {
  const cached = await cacheGet(fastify, key);
  if (cached !== null) {
    return cached;
  }
  const value = await factory();
  await cacheSet(fastify, key, value, options);
  return value;
}

/**
 * Invalidate all keys matching a glob pattern.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} pattern
 * @returns {Promise<number>} number of keys deleted
 */
export async function cacheInvalidate(fastify, pattern) {
  if (!fastify.redis) {
    return 0;
  }
  try {
    const keys = await fastify.redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return await fastify.redis.del(keys);
  } catch (error) {
    fastify.log.warn({ err: error, pattern }, 'cache invalidation failed');
    return 0;
  }
}

/**
 * Whether the Redis client is registered and connected.
 *
 * @param {import('fastify').Fastify} fastify
 * @returns {boolean}
 */
export function isRedisAvailable(fastify) {
  if (!fastify.redis) {
    return false;
  }
  return fastify.redis.status === 'ready';
}

export default { cacheGet, cacheSet, cacheDel, cacheRemember, cacheInvalidate, isRedisAvailable };
