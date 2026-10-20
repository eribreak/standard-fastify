# Backend Base

A reusable **Node.js backend base** built on Fastify + Prisma + PostgreSQL.
It is a modular monolith: one application, clear module boundaries, no
microservices, no Redis, no TypeScript — just the core capabilities needed to
ship a REST API and deploy it with Docker.

## Tech stack

| Component  | Version                 |
| ---------- | ----------------------- |
| Node.js    | 24 LTS (`>=24.0.0`)     |
| pnpm       | 9.15.9                  |
| Fastify    | 5.12.7                  |
| Prisma ORM | 6.19.3                  |
| PostgreSQL | 16 (via Docker Compose) |
| Pino       | 10.4.0 (logging)        |
| Vitest     | 5.0.5 (testing)         |
| ESLint     | 10.13.0                 |
| Prettier   | 3.9.10                  |
| Docker     | multi-stage image       |

API prefix: `/api/v1`. OpenAPI + Swagger UI at `/api/v1/docs`.

## Quick start

### 1. Install Node.js and pnpm

```bash
# Node 24 LTS
corepack enable
corepack prepare pnpm@9.15.9 --activate
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create your environment

```bash
cp .env.example .env
# edit .env with your values
```

### 4. Start PostgreSQL (local)

```bash
docker compose up -d db
```

### 5. Generate Prisma client and run migrations

```bash
pnpm db:generate
pnpm db:migrate
```

> `db:migrate` runs `prisma migrate dev` — for development only. In
> production use `pnpm db:deploy` (`prisma migrate deploy`) as a controlled
> step; the app never runs migrations on startup.

### 6. Run the app

```bash
pnpm dev     # watch mode
pnpm start   # production mode
```

### 7. Check it works

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

Swagger UI: <http://localhost:3000/api/v1/docs>

## Commands

| Command                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| `pnpm dev`              | Start the server in watch mode            |
| `pnpm start`            | Start the server in production mode       |
| `pnpm lint`             | Run ESLint                                |
| `pnpm format`           | Format code with Prettier                 |
| `pnpm format:check`     | Check formatting without modifying files  |
| `pnpm test`             | Run all tests                             |
| `pnpm test:unit`        | Run unit tests only                       |
| `pnpm test:integration` | Run integration/API tests only            |
| `pnpm db:generate`      | Generate the Prisma client                |
| `pnpm db:migrate`       | Create and apply migrations (development) |
| `pnpm db:deploy`        | Apply pending migrations (production)     |

## Docker

```bash
docker compose up --build
```

The image is built with `node:24-alpine`, runs as a non-root user, and does
not bake `.env` or secrets into the image. The database volume persists data
between runs.

## Testing

```bash
pnpm test
```

- **Unit** (`tests/unit/`): environment validation, pure logic.
- **Integration** (`tests/integration/`): Fastify `inject()` tests for health
  endpoints, response contract, error handling, and OpenAPI/Swagger UI.

Tests use a separate configuration and never touch production databases.

## Configuration

All configuration comes from environment variables:

| Variable          | Required | Default                  | Purpose                         |
| ----------------- | -------- | ------------------------ | ------------------------------- |
| `NODE_ENV`        | no       | `development`            | Runtime environment             |
| `HOST`            | no       | `0.0.0.0`                | Bind address                    |
| `PORT`            | no       | `3000`                   | HTTP port                       |
| `DATABASE_URL`    | **yes**  | —                        | PostgreSQL connection URL       |
| `CORS_ORIGINS`    | no       | `http://localhost:3001`  | Comma-separated allowed origins |
| `SWAGGER_ENABLED` | no       | `true`                   | Disable Swagger UI when `false` |
| `LOG_LEVEL`       | no       | `debug` / `info` in prod | Pino log level                  |

Secrets are never committed. `.env` is git-ignored and excluded from the Docker
build context.

## Project structure

```
src/
  app.js                 # Builds the Fastify instance (no port opened)
  server.js              # Entry point: listens, owns startup/shutdown
  config/                # Environment validation and app config
  plugins/               # Fastify plugins (DB, security, swagger, logging)
  common/                # Shared errors, response contract, utils
  modules/health/        # /health/live and /health/ready
  infrastructure/database/  # Prisma client
prisma/                  # Schema and migrations
tests/                   # Unit and integration tests
.github/workflows/       # CI
```

## What is intentionally NOT included

- Authentication / authorization (no JWT, no OAuth, no session)
- Redis, cache, queue, WebSocket, SSE
- Microservices
- TypeScript
- Email, file storage, search engine
- Distributed tracing

These are added only when a real requirement exists.

## CI

GitHub Actions runs on every push/PR to `main`: checkout → install with a
frozen lockfile → generate Prisma client → migrate → lint → format check →
tests → Docker image build.
