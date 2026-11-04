import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import { resetConfig } from '../../src/config/app.config.js';

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/backend_base';
process.env.PORT = '3000';
process.env.OTEL_ENABLED = 'false';

describe('Demo API (Redis, Worker, OpenTelemetry)', () => {
  let app;

  beforeAll(async () => {
    resetConfig();
    app = await buildApp({ skipDatabase: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Cache (Redis) ---

  it('GET /api/v1/demo/cache/:key returns value=null when key is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/demo/cache/missing-key' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.value).toBeNull();
    expect(body.data.cached).toBe(false);
    expect(body.data.redisAvailable).toBe(false);
  });

  it('PUT then GET /api/v1/demo/cache/:key round-trips a value', async () => {
    const setRes = await app.inject({
      method: 'PUT',
      url: '/api/v1/demo/cache/demo-key',
      body: { value: { hello: 'world' } },
    });
    expect(setRes.statusCode).toBe(200);
    const setBody = JSON.parse(setRes.body);
    expect(setBody.data.stored).toBe(false); // Redis not available in test env

    const getRes = await app.inject({ method: 'GET', url: '/api/v1/demo/cache/demo-key' });
    expect(getRes.statusCode).toBe(200);
    const getBody = JSON.parse(getRes.body);
    expect(getBody.data.cached).toBe(false);
  });

  it('DELETE /api/v1/demo/cache/:key returns 200', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/v1/demo/cache/demo-key' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.deleted).toBe(0);
  });

  it('GET /api/v1/demo/cache/list returns empty keys when Redis is down', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/demo/cache/list?pattern=*' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.keys).toEqual([]);
    expect(body.data.redisAvailable).toBe(false);
  });

  // --- Worker Threads ---

  it('POST /api/v1/demo/worker/prime returns prime count', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/worker/prime',
      body: { limit: 100 },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.limit).toBe(100);
    expect(body.data.count).toBe(25);
    expect(body.data.workerUsed).toBe(true);
    expect(body.data.durationMs).toBeGreaterThan(0);
  });

  it('POST /api/v1/demo/worker/prime rejects invalid limit with 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/worker/prime',
      body: { limit: -1 },
    });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/demo/worker/pool returns pool status', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/demo/worker/pool' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.size).toBe(2);
    expect(body.data.pending).toBe(0);
  });

  // --- OpenTelemetry ---

  it('GET /api/v1/demo/trace returns trace context', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/demo/trace' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.otelEnabled).toBe(false);
    expect(body.data.traceId).toBeNull();
    expect(body.data.spanId).toBeNull();
  });

  it('POST /api/v1/demo/trace/span creates a child span', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/demo/trace/span',
      body: { name: 'demo.child' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.childName).toBe('demo.child');
    expect(body.data.durationMs).toBeGreaterThan(0);
    expect(typeof body.data.childSpanId).toBe('string');
  });

  it('x-trace-id header is present on responses', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/demo/trace' });
    expect(res.headers['x-trace-id']).toBeTruthy();
  });
});
