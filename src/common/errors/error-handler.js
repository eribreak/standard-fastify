import { AppError, toAppError } from './index.js';

/**
 * Register centralized error handling on a Fastify instance.
 *
 * - Fastify's built-in validation errors are normalized to the standard
 *   error contract with code VALIDATION_ERROR.
 * - AppError instances are mapped to their configured HTTP status.
 * - Unknown errors become a 500 with a generic message (details are logged
 *   only server-side).
 *
 * @param {import('fastify').Fastify} fastify
 */
export async function errorHandler(fastify) {
  fastify.setNotFoundHandler((request, reply) => {
    request.log.warn({ url: request.url }, 'route not found');
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: null,
      },
    });
  });

  fastify.setErrorHandler(async (error, request, reply) => {
    // Fastify validation errors (schema/params/query/body).
    if (error.code === 'FST_ERR_VALIDATION' || error.validation) {
      request.log.warn({ err: error }, 'validation error');
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        },
      });
    }

    // Known application error.
    if (error instanceof AppError) {
      if (error.log) {
        request.log.error({ err: error }, error.message);
      }
      return reply.status(error.httpStatus).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    // Unknown error — log details, return generic message.
    request.log.error({ err: error }, 'unhandled error');
    const wrapped = toAppError(error);
    return reply.status(wrapped.httpStatus).send({
      success: false,
      error: {
        code: wrapped.code,
        message: wrapped.message,
        details: null,
      },
    });
  });
}

export default errorHandler;
