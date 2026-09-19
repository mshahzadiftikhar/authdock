import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../auth-engine.interface';

/** Use as @CurrentUser() user: AuthUser in any route behind AuthGuard. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
