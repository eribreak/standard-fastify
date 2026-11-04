/**
 * Environment variable validation.
 *
 * Reads process.env, validates required values, and returns a normalized
 * config object. Throws a descriptive error on startup when required config
 * is missing or invalid so the process fails fast instead of running in a
 * broken state.
 *
 * @typedef {Object} EnvConfig
 * @property {string} nodeEnv
 * @property {string} host
 * @property {number} port
 * @property {string} databaseUrl
 * @property {string[]} corsOrigins
 * @property {boolean} swaggerEnabled
 * @property {string} logLevel
 * @property {string} redisUrl
 */

const REQUIRED_VARS = ['DATABASE_URL'];

/**
 * Parse and validate environment variables.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {EnvConfig}
 * @throws {Error} when a required variable is missing or a value is invalid.
 */
export function loadEnv(env = process.env) {
  const missing = REQUIRED_VARS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got: ${env.PORT}`);
  }

  const corsOrigins = parseCorsOrigins(env.CORS_ORIGINS);

  const swaggerEnabled = env.SWAGGER_ENABLED !== 'false';

  return {
    nodeEnv: env.NODE_ENV || 'development',
    host: env.HOST || '0.0.0.0',
    port,
    databaseUrl: env.DATABASE_URL,
    corsOrigins,
    swaggerEnabled,
    logLevel: env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
    redisUrl: env.REDIS_URL || 'redis://localhost:6379',
  };
}

/**
 * Parse a comma-separated list of CORS origins.
 *
 * @param {string|undefined} raw
 * @returns {string[]}
 */
function parseCorsOrigins(raw) {
  if (!raw || raw.trim() === '') {
    return ['http://localhost:3001'];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default loadEnv;
