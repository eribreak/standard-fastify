/**
 * Prime-counting task.
 *
 * A deliberately CPU-heavy task used to demonstrate worker threads.
 * Runs in a worker thread so the event loop is not blocked.
 *
 * @param {{ limit: number }} payload
 * @returns {{ limit: number, count: number }}
 */
export default function primeTask(payload) {
  const limit = Number(payload?.limit ?? 100000);
  if (!Number.isFinite(limit) || limit < 0) {
    const error = new Error('limit must be a non-negative number');
    // Structured fields survive the worker → pool message boundary and are
    // mapped back to an HTTP 422 by the centralized error handler.
    error.code = 'VALIDATION_ERROR';
    error.httpStatus = 422;
    throw error;
  }

  let count = 0;
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) count++;
  }

  return { limit, count };
}
