import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';

/**
 * Configure the OTLP trace exporter on the global tracer provider.
 *
 * Reads OTEL_EXPORTER_OTLP_ENDPOINT (defaults to localhost:4318, HTTP/protobuf).
 * Returns the span processor so it can be shut down gracefully.
 *
 * @returns {BatchSpanProcessor|null}
 */
export function configureOtlpExporter() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const exporter = new OTLPTraceExporter({ url: endpoint });
  const processor = new BatchSpanProcessor(exporter);
  trace.getTracerProvider().addSpanProcessor(processor);
  return processor;
}

export async function shutdownOtlp(processor) {
  if (processor) {
    await processor.shutdown();
  }
}

export default { configureOtlpExporter, shutdownOtlp };
