import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedPrincipal } from '../strategies/jwt.strategy';

/**
 * Restricts an endpoint to backoffice admins only, based on the `role`
 * discriminant `JwtStrategy.validate` attaches to `req.user` (see
 * `AuthenticatedPrincipal`). MUST run AFTER `JwtAuthGuard` so `req.user` is
 * already populated — e.g. `@UseGuards(JwtAuthGuard, AdminGuard)` (guards
 * run in the order listed, same pattern as NestJS's own
 * `AuthGuard('jwt') + RolesGuard` authorization recipe).
 *
 * Deliberately minimal: this project only distinguishes admin vs. regular
 * user today, so this is NOT a general-purpose role system — don't extend
 * it into one without a real need.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedPrincipal }>();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('ADMIN_ONLY');
    }

    return true;
  }
}
