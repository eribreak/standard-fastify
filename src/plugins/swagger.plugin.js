import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

/**
 * Register OpenAPI + Swagger UI.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {{ swaggerEnabled?: boolean, openapi?: object }} [options]
 */
export const registerSwagger = fp(async (fastify, options = {}) => {
  if (options.swaggerEnabled === false) {
    return;
  }

  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Backend Base API',
        version: '1.0.0',
        description: 'Reusable backend base API. See /api/v1/docs for Swagger UI.',
      },
      servers: [{ url: '/', description: 'default' }],
      tags: [{ name: 'health', description: 'Liveness and readiness probes' }],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/api/v1/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
});

export default registerSwagger;
