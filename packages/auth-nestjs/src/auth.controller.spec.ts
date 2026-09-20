import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession, AuthUser } from './auth-engine.interface';

// @nestjs/throttler doesn't publicly export these key strings, but they're a
// stable part of how @Throttle() stores its metadata (see
// throttler.decorator.js) — reading them directly is the only way to assert
// the actual configured limit/ttl without spinning up a full app + guard.
const THROTTLER_LIMIT_KEY = 'THROTTLER:LIMITdefault';
const THROTTLER_TTL_KEY = 'THROTTLER:TTLdefault';

function throttleOf(method: Function) {
  return {
    limit: Reflect.getMetadata(THROTTLER_LIMIT_KEY, method),
    ttl: Reflect.getMetadata(THROTTLER_TTL_KEY, method),
  };
}

const user: AuthUser = { id: '1', email: 'a@b.com', emailVerified: true, createdAt: new Date() };

function makeRes(): Response {
  return { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;
}

describe('AuthController — rate limiting', () => {
  // Brute-force/enumeration mitigation — CLAUDE.md calls these out by name
  // as security-relevant, and a limit silently dropped or loosened during a
  // refactor wouldn't fail any behavioral test, only this metadata check.

  it('rate-limits signup to 5/minute', () => {
    expect(throttleOf(AuthController.prototype.signUp)).toEqual({ limit: 5, ttl: 60_000 });
  });

  it('rate-limits login to 10/minute', () => {
    expect(throttleOf(AuthController.prototype.login)).toEqual({ limit: 10, ttl: 60_000 });
  });

  it('rate-limits forgot-password to 5/minute', () => {
    expect(throttleOf(AuthController.prototype.forgotPassword)).toEqual({ limit: 5, ttl: 60_000 });
  });
});

describe('AuthController — session cookie handling', () => {
  it('sets an httpOnly, sameSite=lax session cookie on login', async () => {
    const session: AuthSession = { user, token: 'a-session-token', expiresAt: new Date('2030-01-01') };
    const auth = { signIn: jest.fn().mockResolvedValue(session) } as unknown as AuthService;
    const controller = new AuthController(auth);
    const res = makeRes();

    await controller.login({ email: user.email, password: 'x' }, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'authdock_session',
      'a-session-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', expires: session.expiresAt }),
    );
  });

  it('clears the cookie and signs out on logout when a session cookie is present', async () => {
    const auth = { signOut: jest.fn().mockResolvedValue(undefined) } as unknown as AuthService;
    const controller = new AuthController(auth);
    const res = makeRes();
    const req = { cookies: { authdock_session: 'a-session-token' } } as any;

    await controller.logout(req, res);

    expect(auth.signOut).toHaveBeenCalledWith('a-session-token');
    expect(res.clearCookie).toHaveBeenCalledWith('authdock_session');
  });

  it('still clears the cookie on logout even with no session cookie present (no-op signOut)', async () => {
    const auth = { signOut: jest.fn() } as unknown as AuthService;
    const controller = new AuthController(auth);
    const res = makeRes();
    const req = { cookies: {} } as any;

    await controller.logout(req, res);

    expect(auth.signOut).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('authdock_session');
  });
});

describe('AuthController — forgot-password account enumeration protection', () => {
  it('returns the same message whether or not the account exists', async () => {
    const auth = { requestPasswordReset: jest.fn().mockResolvedValue(undefined) } as unknown as AuthService;
    const controller = new AuthController(auth);

    const result = await controller.forgotPassword({ email: 'anyone@example.com' });

    expect(result).toEqual({ message: 'If an account with that email exists, a reset link has been sent.' });
  });
});
