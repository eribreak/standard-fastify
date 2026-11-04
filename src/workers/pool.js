/**
 * Worker thread pool.
 *
 * Runs CPU-bound tasks in Node.js worker threads so the event loop stays
 * responsive. Tasks are plain ESM modules under `src/workers/tasks/` that
 * export a single default function.
 *
 * @example
 * import { TaskPool } from './pool.js';
 * const pool = new TaskPool({ size: 2 });
 * const result = await pool.run('prime', { limit: 100000 });
 * pool.terminate();
 */

import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, 'worker.js');

/**
 * @typedef {Object} PoolOptions
 * @property {number} [size] number of worker threads (default: 1)
 * @property {number} [maxQueue] max queued tasks (default: 100)
 * @property {number} [taskTimeout] per-task timeout in ms (default: 0 = no timeout)
 */

/**
 * @typedef {Object} TaskMessage
 * @property {string} task
 * @property {unknown} payload
 */

/**
 * @typedef {Object} TaskResult
 * @property {unknown} result
 */

export class TaskPool {
  /**
   * @param {PoolOptions} [options]
   */
  constructor(options = {}) {
    this.size = options.size ?? 1;
    this.maxQueue = options.maxQueue ?? 100;
    this.taskTimeout = options.taskTimeout ?? 0;
    this.workers = [];
    this.queue = [];
    this.nextId = 1;
    this._init();
  }

  _init() {
    for (let i = 0; i < this.size; i++) {
      this.workers.push(this._createWorker());
    }
  }

  _createWorker() {
    const worker = new Worker(WORKER_PATH);
    worker.on('error', (_error) => {
      // Worker crashed — replace it so the pool keeps working.
      const idx = this.workers.indexOf(worker);
      if (idx !== -1) {
        this.workers.splice(idx, 1, this._createWorker());
      }
    });
    return worker;
  }

  /**
   * Run a named task in the pool.
   *
   * @param {string} task
   * @param {unknown} [payload]
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<unknown>}
   */
  run(task, payload, options = {}) {
    if (typeof task !== 'string' || !task) {
      return Promise.reject(new Error('Task name must be a non-empty string'));
    }

    if (this.queue.length >= this.maxQueue) {
      return Promise.reject(new Error(`Task queue is full (${this.maxQueue})`));
    }

    return new Promise((resolve, reject) => {
      const entry = { task, payload, resolve, reject, id: this.nextId++ };

      let timer = null;
      if (options.timeout ?? this.taskTimeout) {
        timer = setTimeout(() => {
          reject(
            new Error(`Task "${task}" timed out after ${options.timeout ?? this.taskTimeout}ms`)
          );
        }, options.timeout ?? this.taskTimeout);
      }

      const originalReject = entry.reject;
      entry.reject = (err) => {
        if (timer) clearTimeout(timer);
        originalReject(err);
      };

      this.queue.push(entry);
      this._process();
    });
  }

  _process() {
    if (this.queue.length === 0) {
      return;
    }

    const worker = this.workers.find((w) => !w._busy);
    if (!worker) {
      return; // all workers busy; queue will drain as they free up
    }
    worker._busy = true;

    const entry = this.queue.shift();
    const message = { id: entry.id, task: entry.task, payload: entry.payload };

    const onMessage = (message) => {
      worker.off('message', onMessage);
      worker._busy = false;

      if (message.ok) {
        entry.resolve(message.result);
      } else {
        entry.reject(new Error(message.error));
      }

      this._process();
    };

    worker.on('message', onMessage);
    worker.postMessage(message);
  }

  /**
   * Terminate all workers in the pool.
   *
   * @returns {Promise<void>}
   */
  terminate() {
    return Promise.all(this.workers.map((w) => w.terminate()));
  }

  /**
   * Number of tasks currently queued.
   *
   * @returns {number}
   */
  get pending() {
    return this.queue.length;
  }
}

export default TaskPool;
