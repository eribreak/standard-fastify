import { healthLiveSchema, healthReadySchema } from './health.schema.js';
import { sendSuccess } from '../../common/utils/response.js';

/**
 * Register health routes on the Fastify instance.
 *
 * Liveness (`/health/live`) is independent of the database: it only confirms
 * the process is alive. Readiness (`/health/ready`) confirms the application
 * can serve traffic, which includes the database when it is a required
 * dependency.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {{ checkDatabase: () => Promise<boolean> }} [options]
 */
export function registerHealthRoutes(fastify, options = {}) {
  const checkDatabase = options.checkDatabase || (async () => true);

  fastify.get('/health/live', { schema: healthLiveSchema }, async (request, reply) =>
    sendSuccess(reply, { status: 'ok', uptime: process.uptime() })
  );

  fastify.get('/health/ready', { schema: healthReadySchema }, async (request, reply) => {
    let databaseOk = false;
    try {
      databaseOk = await checkDatabase();
    } catch {
      databaseOk = false;
    }

    if (databaseOk) {
      return sendSuccess(reply, { status: 'ok', database: 'ok' });
    }

    return reply.status(503).send({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        details: { database: 'error' },
      },
    });
  });
}

export default registerHealthRoutes;
