import { describe, it, expect } from 'vitest';
import { loadEnv } from '../../src/config/env.js';
import { resetConfig } from '../../src/config/app.config.js';

describe('loadEnv', () => {
  it('throws when DATABASE_URL is missing', () => {
    resetConfig();
    expect(() => loadEnv({})).toThrow(/Missing required environment variables/);
  });

  it('throws on invalid PORT', () => {
    expect(() => loadEnv({ DATABASE_URL: 'postgresql://u:p@localhost/db', PORT: 'abc' })).toThrow(
      /PORT must be an integer/
    );
  });

  it('throws on out-of-range PORT', () => {
    expect(() => loadEnv({ DATABASE_URL: 'postgresql://u:p@localhost/db', PORT: 70000 })).toThrow(
      /PORT must be an integer/
    );
  });

  it('applies defaults for optional values', () => {
    const cfg = loadEnv({ DATABASE_URL: 'postgresql://u:p@localhost/db' });
    expect(cfg.nodeEnv).toBe('development');
    expect(cfg.host).toBe('0.0.0.0');
    expect(cfg.port).toBe(3000);
    expect(cfg.corsOrigins).toEqual(['http://localhost:3001']);
    expect(cfg.swaggerEnabled).toBe(true);
    expect(cfg.logLevel).toBe('debug');
  });

  it('parses a comma-separated CORS list', () => {
    const cfg = loadEnv({
      DATABASE_URL: 'postgresql://u:p@localhost/db',
      CORS_ORIGINS: 'http://a.com, http://b.com',
    });
    expect(cfg.corsOrigins).toEqual(['http://a.com', 'http://b.com']);
  });

  it('disables swagger when SWAGGER_ENABLED=false', () => {
    const cfg = loadEnv({
      DATABASE_URL: 'postgresql://u:p@localhost/db',
      PORT: '3000',
      SWAGGER_ENABLED: 'false',
    });
    expect(cfg.swaggerEnabled).toBe(false);
  });
});
