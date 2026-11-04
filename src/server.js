import { buildApp } from './app.js';
import { getConfig } from './config/app.config.js';
import { initTracing, shutdownTracing } from './instrumentation.js';

/**
 * Start the HTTP server.
 *
 * Reads configuration, builds the Fastify app, listens on the configured
 * host/port, and installs graceful shutdown handlers for SIGINT/SIGTERM.
 */
export async function startServer() {
  const config = getConfig();

  // Initialize OpenTelemetry before building the app so auto-instrumentation
  // is active for the entire request lifecycle.
  initTracing();

  const app = await buildApp();

  await app.listen({ port: config.env.port, host: config.env.host });

  const shutdown = async (signal) => {
    app.log.info({ signal }, 'received shutdown signal, closing gracefully');
    try {
      await app.close();
    } catch (error) {
      app.log.error({ err: error }, 'error during graceful shutdown');
    }
    await shutdownTracing();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return app;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default startServer;
