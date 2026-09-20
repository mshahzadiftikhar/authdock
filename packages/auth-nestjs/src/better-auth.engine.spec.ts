// better-auth ships ESM, which breaks ts-jest's default CJS transform when
// imported for real — mock it and 'better-auth/plugins' before importing
// better-auth.engine.ts, so Jest never has to parse the real module at all.
jest.mock('better-auth', () => ({ betterAuth: jest.fn() }));
jest.mock('better-auth/plugins', () => ({ bearer: jest.fn(() => 'bearer-plugin') }));

import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { BetterAuthEngine, createBetterAuthInstance } from './better-auth.engine';
import { AuthConfig } from './config/auth-config.schema';
import { EmailProvider } from './email/email-provider.interface';

const mockedBetterAuth = betterAuth as jest.Mock;

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

function makeFakeAuth(apiOverrides: Record<string, jest.Mock> = {}) {
  return {
    api: {
      signUpEmail: jest.fn(),
      signInEmail: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      verifyEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      ...apiOverrides,
    },
  };
}

function lastBetterAuthOptions() {
  return mockedBetterAuth.mock.calls[mockedBetterAuth.mock.calls.length - 1][0];
}

const fakePool = {} as import('pg').Pool;
const fakeEmailProvider: EmailProvider = { send: jest.fn().mockResolvedValue(undefined) };

beforeEach(() => {
  mockedBetterAuth.mockReset();
  (bearer as jest.Mock).mockClear();
  (fakeEmailProvider.send as jest.Mock).mockClear();
});

describe('createBetterAuthInstance — config wiring', () => {
  // Both of these already caused real incidents this session (missing
  // bearer() meant every session check 401'd; a wrong baseURL built broken
  // verification links) — pinning the config shape directly, not just the
  // symptom, so a future refactor can't silently regress either one.

  it('registers the bearer plugin — required for signOut/verifySession, which authenticate via Authorization: Bearer', () => {
    mockedBetterAuth.mockReturnValue(makeFakeAuth());
    createBetterAuthInstance(fakePool, config, fakeEmailProvider);

    expect(bearer).toHaveBeenCalled();
    expect(lastBetterAuthOptions().plugins).toContain('bearer-plugin');
  });

  it('sets baseURL to the API origin only (no path) — a full path makes better-auth skip appending its own basePath', () => {
    mockedBetterAuth.mockReturnValue(makeFakeAuth());
    createBetterAuthInstance(fakePool, config, fakeEmailProvider);

    expect(lastBetterAuthOptions().baseURL).toBe('http://localhost:3000');
  });

  it('leaves baseURL undefined when API_URL is not configured', () => {
    mockedBetterAuth.mockReturnValue(makeFakeAuth());
    createBetterAuthInstance(fakePool, { ...config, API_URL: undefined }, fakeEmailProvider);

    expect(lastBetterAuthOptions().baseURL).toBeUndefined();
  });

  it('requires email verification before sign-in', () => {
    mockedBetterAuth.mockReturnValue(makeFakeAuth());
    createBetterAuthInstance(fakePool, config, fakeEmailProvider);

    expect(lastBetterAuthOptions().emailAndPassword.requireEmailVerification).toBe(true);
  });

  it('routes verification/reset emails through the given EmailProvider, rebuilt against FRONTEND_URL', async () => {
    mockedBetterAuth.mockReturnValue(makeFakeAuth());
    createBetterAuthInstance(fakePool, config, fakeEmailProvider);
    const options = lastBetterAuthOptions();

    await options.emailVerification.sendVerificationEmail({
      user: { email: 'a@b.com' },
      url: 'http://localhost:3000/api/auth/verify-email?token=abc',
    });
    expect(fakeEmailProvider.send).toHaveBeenCalledWith(
      'a@b.com',
      'Verify your email',
      expect.stringContaining('http://localhost:5173/verify-email?token=abc'),
    );

    await options.emailAndPassword.sendResetPassword({
      user: { email: 'a@b.com' },
      url: 'http://localhost:3000/api/auth/reset-password/xyz?callbackURL=%2F',
    });
    expect(fakeEmailProvider.send).toHaveBeenCalledWith(
      'a@b.com',
      'Reset your password',
      expect.stringContaining('http://localhost:5173/reset-password?token=xyz'),
    );
  });
});

describe('BetterAuthEngine', () => {
  it('signUp defaults the display name from the email and reports verificationSent', async () => {
    const fakeAuth = makeFakeAuth({
      signUpEmail: jest
        .fn()
        .mockResolvedValue({ user: { id: '1', email: 'a@b.com', emailVerified: false, createdAt: new Date('2026-01-01') } }),
    });
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    const result = await engine.signUp({ email: 'a@b.com', password: 'correct-horse' });

    expect(fakeAuth.api.signUpEmail).toHaveBeenCalledWith({
      body: { email: 'a@b.com', password: 'correct-horse', name: 'a' },
    });
    expect(result).toEqual({
      user: { id: '1', email: 'a@b.com', emailVerified: false, createdAt: new Date('2026-01-01') },
      verificationSent: true,
    });
  });

  it('signOut authenticates via Authorization: Bearer <token>, not a cookie', async () => {
    const fakeAuth = makeFakeAuth();
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    await engine.signOut('a-session-token');

    expect(fakeAuth.api.signOut).toHaveBeenCalledWith({ headers: { authorization: 'Bearer a-session-token' } });
  });

  it('verifySession returns the mapped user when the engine finds a session', async () => {
    const fakeAuth = makeFakeAuth({
      getSession: jest.fn().mockResolvedValue({ user: { id: '1', email: 'a@b.com', emailVerified: true, createdAt: new Date() } }),
    });
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    const user = await engine.verifySession('a-session-token');

    expect(fakeAuth.api.getSession).toHaveBeenCalledWith({ headers: { authorization: 'Bearer a-session-token' } });
    expect(user?.id).toBe('1');
  });

  it('verifySession returns null when there is no session', async () => {
    const fakeAuth = makeFakeAuth({ getSession: jest.fn().mockResolvedValue(null) });
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    expect(await engine.verifySession('bad-token')).toBeNull();
  });

  it('verifySession returns null (not throw) when the engine call itself errors', async () => {
    const fakeAuth = makeFakeAuth({ getSession: jest.fn().mockRejectedValue(new Error('boom')) });
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    await expect(engine.verifySession('a-token')).resolves.toBeNull();
  });

  it('requestPasswordReset delegates to better-auth without branching on account existence', async () => {
    const fakeAuth = makeFakeAuth();
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    await engine.requestPasswordReset('anyone@example.com');

    expect(fakeAuth.api.requestPasswordReset).toHaveBeenCalledWith({ body: { email: 'anyone@example.com' } });
  });

  it('resetPassword forwards the token and new password', async () => {
    const fakeAuth = makeFakeAuth();
    mockedBetterAuth.mockReturnValue(fakeAuth);
    const engine = new BetterAuthEngine(fakePool, config, fakeEmailProvider);

    await engine.resetPassword('a-reset-token', 'new-correct-horse');

    expect(fakeAuth.api.resetPassword).toHaveBeenCalledWith({
      body: { token: 'a-reset-token', newPassword: 'new-correct-horse' },
    });
  });
});
