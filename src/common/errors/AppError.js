/**
 * Application error with a stable machine-readable code.
 *
 * @typedef {Object} AppErrorOptions
 * @property {string} code
 * @property {string} [message]
 * @property {number} [httpStatus]
 * @property {unknown} [details]
 * @property {boolean} [log=true] whether to log the full error server-side
 * @property {string} [cause] original error message for server-side logging
 */

/**
 * @param {AppErrorOptions} options
 */
export class AppError extends Error {
  /**
   * @param {AppErrorOptions} options
   */
  constructor(options) {
    super(options.message || options.code);
    this.name = 'AppError';
    this.code = options.code;
    this.httpStatus = options.httpStatus || 500;
    this.details = options.details;
    this.log = options.log !== false;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export default AppError;
