# syntax=docker/dockerfile:1
# Multi-stage build: install deps and generate Prisma client, then ship a
# lean runtime image that runs as a non-root user.

FROM node:24-alpine AS base

WORKDIR /app

# Install the locked pnpm version.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS builder

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY src ./src
RUN pnpm db:generate

FROM base AS runner

WORKDIR /app

# Create a non-root user for the runtime.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY package.json ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]