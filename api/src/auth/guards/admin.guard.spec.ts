import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '../strategies/jwt.strategy';
import { AdminGuard } from './admin.guard';

function contextWithUser(
  user?: AuthenticatedPrincipal,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows access when req.user.role is "admin"', () => {
    const context = contextWithUser({
      role: 'admin',
    } as AuthenticatedPrincipal);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects with ForbiddenException (403) when req.user.role is "user"', () => {
    const context = contextWithUser({
      role: 'user',
    } as AuthenticatedPrincipal);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects with ForbiddenException (403) when req.user is missing entirely (defensive — JwtAuthGuard should already 401 first)', () => {
    const context = contextWithUser(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
