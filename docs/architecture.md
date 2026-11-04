# Architecture

## Style

Modular monolith: one Node.js process, one Fastify application, module
boundaries defined by directory, not by deployment.

## Request flow

```
HTTP request
  → Fastify (logging, request id)
  → Security plugins (CORS, helmet, rate limit)
  → Route + JSON Schema validation
  → Controller (only when it adds value)
  → Service (business rules)
  → Repository / Adapter
  → Database (Prisma)
  → Response contract envelope
```

## Components

- **`app.js`** — builds and configures the Fastify instance. Does not open a
  port, so tests can create it without occupying a network socket.
- **`server.js`** — entry point. Reads config, calls `buildApp()`, calls
  `listen()`, and owns SIGINT/SIGTERM graceful shutdown.
- **`config/env.js`** — validates required environment variables and returns a
  normalized config object. Fails fast with a clear message on startup.
- **`plugins/`** — Fastify plugins that integrate external dependencies:
  `database.plugin.js` (Prisma), `security.plugin.js` (CORS, helmet, rate
  limit), `swagger.plugin.js` (OpenAPI + Swagger UI), `logging.plugin.js`
  (request id + structured logs).
- **`common/`** — shared, non-business code: `errors/` (AppError, error codes,
  centralized error handler), `utils/response.js` (success/error envelope),
  `schemas/` (shared JSON schemas when needed).
- **`modules/`** — feature modules. Currently `health/` with its route and
  schema.
- **`infrastructure/database/`** — database adapter (Prisma client).

## Error handling

- Fastify validation errors → `400 VALIDATION_ERROR`.
- `AppError` → its configured HTTP status and code.
- Unknown errors → `500 INTERNAL_ERROR` with a generic message; the full
  error is logged server-side only.
- Unknown routes → `404 NOT_FOUND` via `setNotFoundHandler`.

## Logging

Pino via Fastify. Structured JSON in production. Every request gets a
request id (from the `x-request-id` header or generated). `DATABASE_URL`,
`Authorization`, and `Cookie` headers are redacted.

## Database

Prisma 6.19.3. The client is created in `database.plugin.js` and decorated as
`fastify.prisma`. It is disconnected in the `onClose` hook during graceful
shutdown. Migrations live in `prisma/migrations/` and are committed.

## Security

- CORS origins come from `CORS_ORIGINS`; credentials enabled; no wildcard
  origin with credentials.
- Helmet sets security headers.
- Rate limiting is per-process (in-memory store) — documented as not
  distributed. Defaults to 100 requests / 1 minute.

## Testing

Vitest. Unit tests cover environment validation. Integration tests use
Fastify `inject()` to verify health endpoints, response contract, error
handling, and OpenAPI/Swagger UI without a network port.
