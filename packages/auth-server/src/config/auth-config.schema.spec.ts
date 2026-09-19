import { loadAuthConfig } from './auth-config.schema';

const validBaseEnv = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  SESSION_SECRET: 'a-sufficiently-long-random-secret',
  FRONTEND_URL: 'http://localhost:5173',
};

describe('loadAuthConfig — security-relevant boot validation', () => {
  it('accepts valid development config', () => {
    expect(() => loadAuthConfig(validBaseEnv as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('rejects missing DATABASE_URL', () => {
    const { DATABASE_URL, ...rest } = validBaseEnv;
    expect(() => loadAuthConfig(rest as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
  });

  it('rejects a SESSION_SECRET left at the .env.example placeholder, in production', () => {
    const env = {
      ...validBaseEnv,
      NODE_ENV: 'production',
      SESSION_SECRET: 'change-me-generate-a-real-secret',
      RESEND_API_KEY: 'test-key',
    };
    expect(() => loadAuthConfig(env as unknown as NodeJS.ProcessEnv)).toThrow(/placeholder/);
  });

  it('allows the same placeholder-like value in development (dev-safe fallback)', () => {
    const env = { ...validBaseEnv, SESSION_SECRET: 'change-me-generate-a-real-secret' };
    expect(() => loadAuthConfig(env as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('rejects missing RESEND_API_KEY in production (verification/reset emails cannot send)', () => {
    const env = {
      ...validBaseEnv,
      NODE_ENV: 'production',
      SESSION_SECRET: 'a-sufficiently-long-random-secret-for-prod',
    };
    expect(() => loadAuthConfig(env as unknown as NodeJS.ProcessEnv)).toThrow(/RESEND_API_KEY/);
  });

  it('defaults SESSION_STRATEGY to cookie', () => {
    const config = loadAuthConfig(validBaseEnv as NodeJS.ProcessEnv);
    expect(config.SESSION_STRATEGY).toBe('cookie');
  });
});
