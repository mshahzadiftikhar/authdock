import { toFrontendLink } from './verification-links';
import { AuthConfig } from './config/auth-config.schema';

const config: AuthConfig = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/authdock',
  SESSION_SECRET: 'a-sufficiently-long-random-secret',
  SESSION_STRATEGY: 'cookie',
  RESEND_API_KEY: '',
  RESEND_FROM: 'onboarding@resend.dev',
  FRONTEND_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:3000/api',
};

describe('toFrontendLink', () => {
  // Regression coverage: better-auth puts the token in different places for
  // different flows, and this function once silently dropped the
  // reset-password token because it only checked the query string — caught
  // only by manually curling the flow, not by a test. Both shapes are
  // pinned here so that can't happen silently again.

  it('carries the token when it is in the query string (verify-email)', () => {
    const link = toFrontendLink('http://localhost:3000/api/auth/verify-email?token=abc123', config, '/verify-email');
    expect(link).toBe('http://localhost:5173/verify-email?token=abc123');
  });

  it('carries the token when it is the last path segment (reset-password)', () => {
    const link = toFrontendLink(
      'http://localhost:3000/api/auth/reset-password/xyz789?callbackURL=%2F',
      config,
      '/reset-password',
    );
    expect(link).toBe('http://localhost:5173/reset-password?token=xyz789');
  });

  it('drops better-auth-internal query params like callbackURL — only the token carries over', () => {
    const link = toFrontendLink(
      'http://localhost:3000/api/auth/reset-password/xyz789?callbackURL=%2Fsomewhere',
      config,
      '/reset-password',
    );
    expect(link).not.toContain('callbackURL');
  });

  it('builds against FRONTEND_URL, not the API origin the token came from', () => {
    const link = toFrontendLink('http://localhost:3000/api/auth/verify-email?token=abc123', config, '/verify-email');
    expect(link.startsWith(config.FRONTEND_URL)).toBe(true);
  });
});
