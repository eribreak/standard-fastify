import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TaskPool } from '../../../src/workers/pool.js';

describe('TaskPool', () => {
  let pool;

  beforeAll(() => {
    pool = new TaskPool({ size: 2 });
  });

  afterAll(async () => {
    await pool.terminate();
  });

  it('runs a named task and returns its result', async () => {
    const result = await pool.run('prime', { limit: 100 });
    expect(result).toEqual({ limit: 100, count: 25 });
  });

  it('rejects when the task throws', async () => {
    await expect(pool.run('prime', { limit: -1 })).rejects.toThrow(
      'limit must be a non-negative number'
    );
  });

  it('rejects when the task module does not exist', async () => {
    await expect(pool.run('does-not-exist')).rejects.toThrow();
  });

  it('runs multiple tasks concurrently across worker threads', async () => {
    const results = await Promise.all([
      pool.run('prime', { limit: 200 }),
      pool.run('prime', { limit: 500 }),
    ]);
    expect(results[0].count).toBe(46);
    expect(results[1].count).toBe(95);
  });

  it('rejects when the task name is invalid', async () => {
    await expect(pool.run('')).rejects.toThrow('Task name must be a non-empty string');
    await expect(pool.run(null)).rejects.toThrow('Task name must be a non-empty string');
  });

  it('supports per-task timeout', async () => {
    const fastPool = new TaskPool({ size: 1, taskTimeout: 1 });
    try {
      await expect(fastPool.run('prime', { limit: 1000000 }, { timeout: 1 })).rejects.toThrow(
        'timed out'
      );
    } finally {
      await fastPool.terminate();
    }
  });

  it('reports pending queue length', () => {
    // No tasks queued at this point.
    expect(pool.pending).toBe(0);
  });
});
