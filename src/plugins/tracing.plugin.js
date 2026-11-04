import fp from 'fastify-plugin';
import { trace, context } from '@opentelemetry/api';

/**
 * Fastify plugin to correlate OpenTelemetry trace/span IDs with Fastify request logs.
 *
 * When OpenTelemetry is active, the current span's trace/span IDs are attached
 * to the request and response. When OTel is not active, the request id is used
 * as the trace id so logs and clients always have a correlation header.
 */
export const registerTracing = fp(async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    request.context = context.active();
    const currentSpan = trace.getSpan(request.context);
    if (currentSpan) {
      const { traceId, spanId } = currentSpan.spanContext();
      request.traceId = traceId;
      request.spanId = spanId;
    } else {
      request.traceId = request.id;
      request.spanId = null;
    }
    reply.header('x-trace-id', request.traceId);
  });
});

export default registerTracing;
