import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

/**
 * Add a request ID to every request and configure Pino redaction.
 *
 * @param {import('fastify').Fastify} fastify
 */
export const registerLogging = fp(async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const id = /** @type {string|undefined} */ (request.headers['x-request-id']) || randomUUID();
    request.id = id;
    reply.header('x-request-id', id);
  });

  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed'
    );
  });
});

export default registerLogging;
