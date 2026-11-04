import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

/**
 * OpenTelemetry Node.js SDK initialization.
 *
 * Configures automatic instrumentation for HTTP, Fastify, Prisma, etc.
 * Controlled by OTEL_ENABLED environment variable (defaults to false in dev).
 */
let sdk = null;

export function initTracing() {
  const enabled = process.env.OTEL_ENABLED === 'true';
  if (!enabled) {
    return null;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'backend-base';

  sdk = new NodeSDK({
    serviceName,
    traceExporter: new ConsoleSpanExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  try {
    sdk.start();
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry SDK:', error);
  }

  return sdk;
}

export async function shutdownTracing() {
  if (sdk) {
    try {
      await sdk.shutdown();
    } catch (error) {
      console.error('Error shutting down OpenTelemetry SDK:', error);
    }
  }
}

export default { initTracing, shutdownTracing };
