import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import { resetConfig } from '../../src/config/app.config.js';

// Use a fake DATABASE_URL so the app can be built without a live database
// for the health/validation/error contract tests.
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/backend_base';
process.env.PORT = '3000';

describe('API contract', () => {
  let app;

  beforeAll(async () => {
    resetConfig();
    // Build without the database plugin so tests do not need a live Postgres.
    app = await buildApp({ skipDatabase: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual({
      success: true,
      data: { status: 'ok', uptime: expect.any(Number) },
      meta: null,
    });
    expect(body.data.uptime).toBeGreaterThan(0);
  });

  it('GET /health/ready returns 200 when database check passes', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toEqual({ status: 'ok', database: 'ok' });
  });

  it('returns x-request-id header on every response', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nope' });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns a consistent error contract for method-not-allowed', async () => {
    // Fastify returns 404 for an unsupported method on a known path by default.
    const res = await app.inject({ method: 'POST', url: '/health/live' });
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');
    expect(body.error).toHaveProperty('details');
  });

  it('does not leak stack traces in production-like error responses', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nope' });
    const body = JSON.parse(res.body);
    expect(JSON.stringify(body)).not.toMatch(/at \w+ \(/);
    expect(JSON.stringify(body)).not.toMatch(/\.js:/);
  });

  it('Swagger UI is reachable', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/docs' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('swagger-ui');
  });

  it('OpenAPI JSON is reachable', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/docs/json' });
    expect(res.statusCode).toBe(200);
    const spec = JSON.parse(res.body);
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/health/live']).toBeTruthy();
    expect(spec.paths['/health/ready']).toBeTruthy();
  });
});
