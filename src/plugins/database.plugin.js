import fp from 'fastify-plugin';

/**
 * Prisma database plugin.
 *
 * Registers a Prisma client on the Fastify instance as `fastify.prisma`.
 * The client is closed during graceful shutdown.
 *
 * @param {import('fastify').Fastify} fastify
 * @param {{ databaseUrl?: string }} [options]
 */
export const registerDatabase = fp(async (fastify, options = {}) => {
  const { PrismaClient } = await import('@prisma/client');

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    datasourceUrl: options.databaseUrl,
  });

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});

export default registerDatabase;
