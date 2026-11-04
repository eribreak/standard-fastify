import fp from 'fastify-plugin';
import { trace, context } from '@opentelemetry/api';

/**
 * Fastify plugin to correlate OpenTelemetry trace/span IDs with Fastify request logs.
 *
 * Enriches `request.log` and reply headers with `trace_id` and `span_id`,
 * and stores the active context on the request so child spans can be created
 * from within route handlers.
 */
export const registerTracing = fp(async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    request.context = context.active();
    const currentSpan = trace.getSpan(request.context);
    if (currentSpan) {
      const { traceId, spanId } = currentSpan.spanContext();
      request.traceId = traceId;
      request.spanId = spanId;
      reply.header('x-trace-id', traceId);
    }
  });
});

export default registerTracing;