import { TaskPool } from '../../workers/pool.js';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  isRedisAvailable,
} from '../../common/cache/cache.service.js';
import { trace } from '@opentelemetry/api';

// Shared worker pool for the demo module.
const pool = new TaskPool({ size: 2 });

/**
 * Cache demo service.
 *
 * @typedef {Object} CacheGetResult
 * @property {unknown} value
 * @property {boolean} cached
 * @property {boolean} redisAvailable
 */

/**
 * Read a cached value by key.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} key
 * @returns {Promise<CacheGetResult>}
 */
export async function cacheGetDemo(fastify, key) {
  const redisAvailable = isRedisAvailable(fastify);
  const value = await cacheGet(fastify, key);
  return { key, value, cached: value !== null, redisAvailable };
}

/**
 * Write a cached value.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} key
 * @param {unknown} value
 * @returns {Promise<{ key: string, stored: boolean }>}
 */
export async function cacheSetDemo(fastify, key, value) {
  const stored = await cacheSet(fastify, key, value, { ttl: 60 });
  return { key, stored };
}

/**
 * Delete a cached key.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} key
 * @returns {Promise<{ key: string, deleted: number }>}
 */
export async function cacheDelDemo(fastify, key) {
  const deleted = await cacheDel(fastify, [key]);
  return { key, deleted };
}

/**
 * List cached keys matching a pattern.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {string} pattern
 * @returns {Promise<{ pattern: string, keys: string[], redisAvailable: boolean }>}
 */
export async function cacheListDemo(fastify, pattern) {
  const redisAvailable = isRedisAvailable(fastify);
  if (!redisAvailable) {
    return { pattern, keys: [], redisAvailable };
  }
  const keys = await fastify.redis.keys(pattern);
  return { pattern, keys, redisAvailable };
}

/**
 * Worker demo service.
 *
 * @typedef {Object} WorkerResult
 * @property {number} limit
 * @property {number} count
 * @property {boolean} workerUsed
 * @property {number} durationMs
 */

/**
 * Run a CPU-bound prime-counting task in the worker pool.
 *
 * @param {{ limit: number }} payload
 * @returns {Promise<WorkerResult>}
 */
export async function workerPrimeDemo(payload) {
  const start = performance.now();
  const result = await pool.run('prime', payload);
  const durationMs = Math.round(performance.now() - start);
  return { ...result, workerUsed: true, durationMs };
}

/**
 * Return the current pool status.
 *
 * @returns {{ size: number, pending: number }}
 */
export function workerPoolStatus() {
  return { size: pool.size, pending: pool.pending };
}

/**
 * Tracing demo service.
 *
 * @typedef {Object} TraceResult
 * @property {string|null} traceId
 * @property {string|null} spanId
 * @property {boolean} otelEnabled
 */

/**
 * Return the current request's trace context.
 *
 * @param {import('fastify').FastifyRequest} request
 * @returns {TraceResult}
 */
export function traceCurrent(request) {
  const span = trace.getSpan(request.context?.active || request.context || {});
  const otelEnabled = process.env.OTEL_ENABLED === 'true';
  if (!span) {
    return { traceId: null, spanId: null, otelEnabled };
  }
  const { traceId, spanId } = span.spanContext();
  return { traceId, spanId, otelEnabled };
}

/**
 * Create a child span inside the current request context and return its
 * trace context alongside the parent.
 *
 * @param {import('fastify').FastifyRequest} request
 * @param {string} childName
 * @returns {Promise<{ traceId: string, parentSpanId: string|null, childSpanId: string, childName: string, durationMs: number }>}
 */
export async function traceSpanDemo(request, childName) {
  const tracer = trace.getTracer('demo');
  const parentContext = request.context || {};

  const start = performance.now();
  return tracer.startActiveSpan(childName, { parent: parentContext }, async (span) => {
    try {
      // Simulate some work.
      await new Promise((r) => setTimeout(r, 10));
      const durationMs = Math.round(performance.now() - start);
      const parentSpan = trace.getSpan(parentContext);
      const parentSpanId = parentSpan ? parentSpan.spanContext().spanId : null;
      const { traceId, spanId } = span.spanContext();
      return {
        traceId,
        parentSpanId,
        childSpanId: spanId,
        childName,
        durationMs,
      };
    } finally {
      span.end();
    }
  });
}

export default {
  cacheGetDemo,
  cacheSetDemo,
  cacheDelDemo,
  cacheListDemo,
  workerPrimeDemo,
  workerPoolStatus,
  traceCurrent,
  traceSpanDemo,
};
