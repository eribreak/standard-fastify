import { AppError } from './AppError.js';

/**
 * Standard error codes used across the API.
 *
 * @readonly
 * @enum {string}
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

/**
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function validationError(message = 'Request validation failed', details) {
  return new AppError({
    code: ERROR_CODES.VALIDATION_ERROR,
    message,
    httpStatus: 400,
    details,
  });
}

/**
 * @param {string} [message]
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function notFoundError(message = 'Resource not found', details) {
  return new AppError({ code: ERROR_CODES.NOT_FOUND, message, httpStatus: 404, details });
}

/**
 * @param {string} [message]
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function conflictError(message = 'Resource already exists', details) {
  return new AppError({ code: ERROR_CODES.CONFLICT, message, httpStatus: 409, details });
}

/**
 * @param {string} [message]
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function unauthorizedError(message = 'Authentication required', details) {
  return new AppError({ code: ERROR_CODES.UNAUTHORIZED, message, httpStatus: 401, details });
}

/**
 * @param {string} [message]
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function forbiddenError(message = 'Forbidden', details) {
  return new AppError({ code: ERROR_CODES.FORBIDDEN, message, httpStatus: 403, details });
}

/**
 * @param {string} [message]
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function rateLimitError(message = 'Too many requests', details) {
  return new AppError({ code: ERROR_CODES.RATE_LIMITED, message, httpStatus: 429, details });
}

/**
 * @param {string} [message]
 * @param {unknown} [details]
 * @returns {AppError}
 */
export function serviceUnavailableError(message = 'Service temporarily unavailable', details) {
  return new AppError({
    code: ERROR_CODES.SERVICE_UNAVAILABLE,
    message,
    httpStatus: 503,
    details,
  });
}

/**
 * Wrap an unknown error into a safe internal error.
 *
 * @param {unknown} error
 * @returns {AppError}
 */
export function toAppError(error) {
  if (error instanceof AppError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error);
  return new AppError({
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Internal server error',
    details: undefined,
    log: true,
    cause: message,
  });
}

export { AppError };

export default {
  ERROR_CODES,
  AppError,
  validationError,
  notFoundError,
  conflictError,
  unauthorizedError,
  forbiddenError,
  rateLimitError,
  serviceUnavailableError,
  toAppError,
};
