/**
 * Worker thread entry point.
 *
 * Runs in a separate thread. Receives `{ id, task, payload }` messages from
 * the pool, dynamically imports the named task module, executes it, and posts
 * the result back. Errors are caught and returned as a structured object so
 * the pool can reject the parent promise without crashing the worker.
 *
 * Tasks are plain modules that export a single default function:
 *   export default (payload) => Promise<result> | result
 */

import { parentPort } from 'node:worker_threads';

if (!parentPort) {
  throw new Error('worker.js must be run inside a Worker thread');
}

parentPort.on('message', async (message) => {
  const { id, task, payload } = message;
  try {
    const module = await import(`./tasks/${task}.js`);
    const fn = module.default;
    if (typeof fn !== 'function') {
      throw new Error(`Task module "${task}" does not export a default function`);
    }
    const result = await fn(payload);
    parentPort.postMessage({ id, ok: true, result });
  } catch (error) {
    parentPort.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
