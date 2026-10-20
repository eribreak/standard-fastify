import Fastify from 'fastify';
import { registerSwagger } from './plugins/swagger.plugin.js';
import { registerSecurity } from './plugins/security.plugin.js';
import { registerDatabase } from './plugins/database.plugin.js';
import { registerLogging } from './plugins/logging.plugin.js';
import { registerHealthRoutes } from './modules/health/health.route.js';
import { getConfig } from './config/app.config.js';
import { errorHandler } from './common/errors/error-handler.js';

/**
 * Build the Fastify application instance.
 *
 * This function does NOT open a port — it returns the configured instance so
 * tests can create it without occupying a network port.
 *
 * @param {object} [options]
 * @param {boolean} [options.skipDatabase=false]
 * @param {boolean} [options.skipPlugins=false]
 * @returns {Promise<import('fastify').Fastify>}
 */
export async function buildApp(options = {}) {
  const config = getConfig();
  const fastify = Fastify({
    logger: {
      level: config.env.logLevel,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'DATABASE_URL'],
      },
    },
    requestTimeout: 30000,
    routerOptions: {
      ignoreTrailingSlash: true,
    },
  });

  await registerLogging(fastify);

  if (!options.skipPlugins) {
    await registerSecurity(fastify, {
      corsOrigins: config.env.corsOrigins,
    });

    await registerSwagger(fastify, {
      swaggerEnabled: config.env.swaggerEnabled,
    });

    if (!options.skipDatabase) {
      await registerDatabase(fastify, { databaseUrl: config.env.databaseUrl });
    }
  }

  await registerHealthRoutes(fastify, {
    checkDatabase: async () => {
      if (!fastify.prisma) {
        return true;
      }
      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
  });

  await errorHandler(fastify);

  return fastify;
}

export default buildApp;
