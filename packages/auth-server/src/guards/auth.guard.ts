import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AUTH_ENGINE } from '../auth.constants';
import { AuthEngine } from '../auth-engine.interface';

/**
 * Global guard: reads the session cookie (or bearer token in 'jwt' mode),
 * verifies it via the AuthEngine, and attaches the user to the request —
 * or rejects with 401. Routes marked @Public() skip this entirely.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_ENGINE) private readonly engine: AuthEngine,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = extractToken(request);
    if (!token) throw new UnauthorizedException('No session');

    const user = await this.engine.verifySession(token);
    if (!user) throw new UnauthorizedException('Invalid or expired session');

    request.user = user;
    return true;
  }
}

function extractToken(request: { cookies?: Record<string, string>; headers: Record<string, string | undefined> }) {
  const cookieToken = request.cookies?.['authdock_session'];
  if (cookieToken) return cookieToken;

  const authHeader = request.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length);

  return null;
}
