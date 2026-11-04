import { describe, it, expect, vi } from 'vitest';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheRemember,
  cacheInvalidate,
} from '../../src/common/cache/cache.service.js';

// Minimal Fastify-like object. `redis` is undefined when Redis is unavailable.
function makeFastify(redis) {
  return {
    redis,
    log: {
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
}

describe('cache.service — Redis unavailable', () => {
  const app = makeFastify(undefined);

  it('cacheGet returns null when redis is missing', async () => {
    expect(await cacheGet(app, 'k')).toBeNull();
  });

  it('cacheSet returns false when redis is missing', async () => {
    expect(await cacheSet(app, 'k', { a: 1 })).toBe(false);
  });

  it('cacheDel returns 0 when redis is missing', async () => {
    expect(await cacheDel(app, ['k'])).toBe(0);
  });

  it('cacheRemember falls through to the factory when redis is missing', async () => {
    const factory = vi.fn(() => Promise.resolve({ value: 42 }));
    const result = await cacheRemember(app, 'k', factory);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ value: 42 });
  });

  it('cacheInvalidate returns 0 when redis is missing', async () => {
    expect(await cacheInvalidate(app, 'pattern:*')).toBe(0);
  });
});

describe('cache.service — Redis available', () => {
  const set = vi.fn(() => Promise.resolve());
  const get = vi.fn(() => Promise.resolve(null));
  const del = vi.fn(() => Promise.resolve(1));
  const keys = vi.fn(() => Promise.resolve(['pattern:1']));

  const app = makeFastify({ set, get, del, keys });

  it('cacheGet parses JSON and returns null on miss', async () => {
    get.mockResolvedValueOnce(null);
    expect(await cacheGet(app, 'k')).toBeNull();

    get.mockResolvedValueOnce(JSON.stringify({ a: 1 }));
    expect(await cacheGet(app, 'k')).toEqual({ a: 1 });
  });

  it('cacheSet serializes JSON and sets an expiry', async () => {
    await cacheSet(app, 'k', { a: 1 }, { ttl: 30 });
    expect(set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'EX', 30);
  });

  it('cacheSet uses the default TTL of 60 seconds', async () => {
    await cacheSet(app, 'k', { a: 1 });
    expect(set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'EX', 60);
  });

  it('cacheDel forwards keys to redis', async () => {
    await cacheDel(app, ['a', 'b']);
    expect(del).toHaveBeenCalledWith(['a', 'b']);
  });

  it('cacheRemember returns the cached value when present', async () => {
    get.mockResolvedValueOnce(JSON.stringify({ cached: true }));
    const factory = vi.fn();
    const result = await cacheRemember(app, 'k', factory);
    expect(factory).not.toHaveBeenCalled();
    expect(result).toEqual({ cached: true });
  });

  it('cacheRemember runs the factory and caches the result on miss', async () => {
    get.mockResolvedValueOnce(null);
    const factory = vi.fn(() => Promise.resolve({ fresh: true }));
    const result = await cacheRemember(app, 'k', factory, { ttl: 5 });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ fresh: true });
    expect(set).toHaveBeenCalledWith('k', JSON.stringify({ fresh: true }), 'EX', 5);
  });

  it('cacheInvalidate scans by pattern and deletes matches', async () => {
    keys.mockResolvedValueOnce(['pattern:1', 'pattern:2']);
    del.mockResolvedValueOnce(2);
    const count = await cacheInvalidate(app, 'pattern:*');
    expect(keys).toHaveBeenCalledWith('pattern:*');
    expect(del).toHaveBeenCalledWith(['pattern:1', 'pattern:2']);
    expect(count).toBe(2);
  });

  it('cacheInvalidate returns 0 when there are no matches', async () => {
    keys.mockResolvedValueOnce([]);
    expect(await cacheInvalidate(app, 'pattern:*')).toBe(0);
    expect(del).not.toHaveBeenCalled();
  });

  it('cache operations swallow redis errors and degrade gracefully', async () => {
    get.mockRejectedValueOnce(new Error('boom'));
    expect(await cacheGet(app, 'k')).toBeNull();
    expect(app.log.warn).toHaveBeenCalled();
  });
});
