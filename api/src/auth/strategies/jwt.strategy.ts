import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminsService } from '../../admins/admins.service';
import { AdminDocument } from '../../admins/schemas/admin.schema';
import { UserDocument } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * `req.user` shape once a regular user token is validated: the full
 * `UserDocument`, exactly as before, plus a `role: 'user'` discriminant so
 * guards downstream (see `AdminGuard`) can tell it apart from
 * `AuthenticatedAdmin` without re-querying either collection.
 */
export type AuthenticatedUser = UserDocument & { role: 'user' };

/**
 * `req.user` shape once a backoffice admin token (`role: 'admin'` in the
 * JWT payload) is validated: the full `AdminDocument` plus the same `role`
 * discriminant.
 */
export type AuthenticatedAdmin = AdminDocument & { role: 'admin' };

/** Everything `JwtStrategy.validate` can return / everything `req.user` can be. */
export type AuthenticatedPrincipal = AuthenticatedUser | AuthenticatedAdmin;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly adminsService: AdminsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Resolves the JWT's `sub` against the right collection based on
   * `payload.role`: backoffice admin tokens (`role: 'admin'`, minted by
   * `AuthService.signAdminJwt`) resolve against `admins`; every other token
   * (regular user tokens, which never carry `role` — see `JwtPayload`)
   * resolves against `users`, exactly as before this admin/user split was
   * introduced.
   *
   * Whatever this returns becomes `req.user` (standard Passport behavior).
   * It always carries a `role` discriminant so guards can tell admins and
   * users apart (see `AdminGuard`) — existing consumers that only read
   * user fields (`AuthController.getProfile` / `/auth/me`,
   * `TournamentsController`'s `req.user._id`) keep working unchanged for
   * user tokens, since a real `UserDocument` is still returned, just with
   * `role: 'user'` attached alongside it.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedPrincipal> {
    if (payload.role === 'admin') {
      const admin = await this.adminsService.findById(payload.sub);
      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }
      return Object.assign(admin, { role: 'admin' as const });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return Object.assign(user, { role: 'user' as const });
  }
}
