import {
  cacheGetSchema,
  cacheSetSchema,
  cacheDelSchema,
  cacheListSchema,
  workerPrimeSchema,
  workerPoolSchema,
  traceSchema,
  traceSpanSchema,
} from './demo.schema.js';
import { sendSuccess } from '../../common/utils/response.js';
import {
  cacheGetDemo,
  cacheSetDemo,
  cacheDelDemo,
  cacheListDemo,
  workerPrimeDemo,
  workerPoolStatus,
  traceCurrent,
  traceSpanDemo,
} from './demo.service.js';

/**
 * Register demo routes used to exercise the Redis, Worker Threads, and
 * OpenTelemetry integrations.
 *
 * @param {import('fastify').Fastify} fastify
 */
export function registerDemoRoutes(fastify) {
  // --- Cache (Redis) ---

  fastify.get('/api/v1/demo/cache/:key', { schema: cacheGetSchema }, async (request, reply) => {
    const key = request.params.key;
    return sendSuccess(reply, await cacheGetDemo(fastify, key));
  });

  fastify.put('/api/v1/demo/cache/:key', { schema: cacheSetSchema }, async (request, reply) => {
    const key = request.params.key;
    const value = request.body.value;
    return sendSuccess(reply, await cacheSetDemo(fastify, key, value));
  });

  fastify.delete('/api/v1/demo/cache/:key', { schema: cacheDelSchema }, async (request, reply) => {
    const key = request.params.key;
    return sendSuccess(reply, await cacheDelDemo(fastify, key));
  });

  fastify.get('/api/v1/demo/cache/list', { schema: cacheListSchema }, async (request, reply) => {
    const pattern = request.query.pattern || '*';
    return sendSuccess(reply, await cacheListDemo(fastify, pattern));
  });

  // --- Worker Threads ---

  fastify.post('/api/v1/demo/worker/prime', { schema: workerPrimeSchema }, async (request, reply) =>
    sendSuccess(reply, await workerPrimeDemo(request.body))
  );

  fastify.get('/api/v1/demo/worker/pool', { schema: workerPoolSchema }, async (request, reply) =>
    sendSuccess(reply, workerPoolStatus())
  );

  // --- OpenTelemetry ---

  fastify.get('/api/v1/demo/trace', { schema: traceSchema }, async (request, reply) =>
    sendSuccess(reply, traceCurrent(request))
  );

  fastify.post('/api/v1/demo/trace/span', { schema: traceSpanSchema }, async (request, reply) => {
    const childName = request.body?.name || 'demo.child';
    return sendSuccess(reply, await traceSpanDemo(request, childName));
  });
}

export default registerDemoRoutes;
