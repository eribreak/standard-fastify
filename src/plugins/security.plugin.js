import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

/**
 * Register CORS, security headers, and rate limiting.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {{
 *   corsOrigins?: string[],
 *   helmetContentSecurityPolicy?: boolean,
 *   rateLimit?: { max?: number, timeWindow?: string }
 * }} [options]
 */
export const registerSecurity = fp(async (fastify, options = {}) => {
  const corsOrigins = options.corsOrigins || ['http://localhost:3001'];

  await fastify.register(fastifyCors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Security headers. In development, allow a relaxed CSP so the Swagger UI
  // inline scripts/styles still work; production keeps the strict default.
  const helmetOptions = {
    contentSecurityPolicy:
      options.helmetContentSecurityPolicy === false
        ? false
        : {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              imgSrc: ["'self'"],
            },
          },
  };

  await fastify.register(fastifyHelmet, helmetOptions);

  await fastify.register(fastifyRateLimit, {
    max: options.rateLimit?.max ?? 100,
    timeWindow: options.rateLimit?.timeWindow ?? '1 minute',
    // Single-process store: documented as not distributed.
    allowList: [],
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later.',
        details: null,
      },
    }),
  });
});

export default registerSecurity;
