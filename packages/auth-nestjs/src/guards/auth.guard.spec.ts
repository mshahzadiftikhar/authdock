import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AuthEngine, AuthUser } from '../auth-engine.interface';

const user: AuthUser = { id: '1', email: 'a@b.com', emailVerified: true, createdAt: new Date() };

function makeContext(request: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeGuard(engine: Partial<AuthEngine>, isPublic: boolean) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(isPublic) } as unknown as Reflector;
  return new AuthGuard(reflector, engine as AuthEngine);
}

describe('AuthGuard', () => {
  // This is the actual access-control chokepoint for every non-@Public()
  // route — a mistake here is an auth bypass or a total lockout, so it gets
  // full branch coverage, not just a happy-path smoke test.

  it('allows @Public() routes without checking a token', async () => {
    const verifySession = jest.fn();
    const guard = makeGuard({ verifySession }, true);

    await expect(guard.canActivate(makeContext({ cookies: {}, headers: {} }))).resolves.toBe(true);
    expect(verifySession).not.toHaveBeenCalled();
  });

  it('rejects when neither a cookie nor a bearer token is present', async () => {
    const guard = makeGuard({ verifySession: jest.fn() }, false);

    await expect(guard.canActivate(makeContext({ cookies: {}, headers: {} }))).rejects.toThrow(UnauthorizedException);
  });

  it('extracts the session token from the authdock_session cookie and attaches the user', async () => {
    const verifySession = jest.fn().mockResolvedValue(user);
    const guard = makeGuard({ verifySession }, false);
    const request = { cookies: { authdock_session: 'cookie-token' }, headers: {} };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(verifySession).toHaveBeenCalledWith('cookie-token');
    expect((request as { user?: AuthUser }).user).toBe(user);
  });

  it('falls back to the Authorization: Bearer header when no cookie is present', async () => {
    const verifySession = jest.fn().mockResolvedValue(user);
    const guard = makeGuard({ verifySession }, false);
    const request = { cookies: {}, headers: { authorization: 'Bearer header-token' } };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(verifySession).toHaveBeenCalledWith('header-token');
  });

  it('ignores a malformed Authorization header (not "Bearer <token>")', async () => {
    const verifySession = jest.fn();
    const guard = makeGuard({ verifySession }, false);
    const request = { cookies: {}, headers: { authorization: 'header-token' } };

    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(UnauthorizedException);
    expect(verifySession).not.toHaveBeenCalled();
  });

  it('prefers the cookie over the Authorization header when both are present', async () => {
    const verifySession = jest.fn().mockResolvedValue(user);
    const guard = makeGuard({ verifySession }, false);
    const request = {
      cookies: { authdock_session: 'cookie-token' },
      headers: { authorization: 'Bearer header-token' },
    };

    await guard.canActivate(makeContext(request));
    expect(verifySession).toHaveBeenCalledWith('cookie-token');
  });

  it('rejects when the engine reports the token invalid or expired', async () => {
    const verifySession = jest.fn().mockResolvedValue(null);
    const guard = makeGuard({ verifySession }, false);
    const request = { cookies: { authdock_session: 'bad-token' }, headers: {} };

    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(UnauthorizedException);
  });
});
