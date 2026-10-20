import { loadEnv } from './env.js';

/**
 * Application configuration, loaded once at startup.
 *
 * @typedef {Object} AppConfig
 * @property {import('./env.js').EnvConfig} env
 */

let cachedConfig = null;

/**
 * Return the cached application config, loading it on first call.
 *
 * @returns {EnvConfig & { env: import('./env.js').EnvConfig }}
 */
export function getConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  const env = loadEnv();
  cachedConfig = { env };
  return cachedConfig;
}

/**
 * Reset the cached config. Intended for tests only.
 */
export function resetConfig() {
  cachedConfig = null;
}

export default getConfig;
