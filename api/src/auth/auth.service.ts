import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { AdminsService } from '../admins/admins.service';
import { AdminDocument } from '../admins/schemas/admin.schema';
import { toUserResponse, UserResponse } from '../users/user-response';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthResult {
  accessToken: string;
  user: UserResponse;
}

export interface BackofficeAuthResult {
  accessToken: string;
  admin: { id: string; email: string };
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    );
  }

  /**
   * Registers a new local (email/password) user and returns a signed JWT.
   */
  async register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const user = await this.usersService.createLocalUser(payload);
    return { accessToken: this.signJwt(user), user: toUserResponse(user) };
  }

  /**
   * Validates local (email/password) credentials and returns a signed JWT.
   * Uses the same "invalid credentials" message for both a non-existent
   * email and a wrong password, to avoid leaking whether an email exists.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (!user.password) {
      throw new UnauthorizedException('USE_GOOGLE_LOGIN');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    await this.usersService.touchLastSignedIn(this.toId(user));

    return { accessToken: this.signJwt(user), user: toUserResponse(user) };
  }

  /**
   * LOGIN with Google. Verifies the Google ID token and maps it against our
   * database (by googleId, then by email — linking Google to an existing
   * local account when found), but NEVER creates a user here: if this
   * Google identity has no account yet, rejects with
   * `UnauthorizedException('USER_NOT_REGISTERED')` so the frontend can
   * route the user to the register flow instead. Account creation lives
   * exclusively in `registerWithGoogle` below.
   */
  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleToken(idToken);

    const user = await this.usersService.findByGoogleIdentity(googleUser);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_REGISTERED');
    }

    await this.usersService.touchLastSignedIn(this.toId(user));

    return { accessToken: this.signJwt(user), user: toUserResponse(user) };
  }

  /**
   * REGISTER with Google. Verifies the Google ID token and creates a new
   * user for this Google identity if none exists yet (by googleId or by
   * email, linking Google to an existing local account when found — same
   * matching rules as `loginWithGoogle`).
   *
   * Behavior when the account already exists: this endpoint is idempotent
   * rather than erroring — it simply signs in the existing user and returns
   * a fresh JWT, the same way Google's own "Sign in with Google" button
   * transparently handles both first-time and returning users. This differs
   * from local registration (`register`, which throws
   * `EMAIL_ALREADY_REGISTERED`) because there is no password/credential
   * conflict to protect against with Google — re-authenticating an existing
   * Google-linked account is always safe.
   */
  async registerWithGoogle(idToken: string): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleToken(idToken);

    const user = await this.usersService.findOrCreateFromGoogle(googleUser);

    // Also covers the "re-login" case described above: when the identity
    // already existed, this records the new sign-in. For a brand-new user
    // `lastSignedIn` was just set to `createdAt` inside
    // `findOrCreateFromGoogle` a moment ago, so this simply nudges it a few
    // milliseconds forward — harmless, and keeps this call unconditional
    // instead of duplicating the existing-vs-new lookup already done there.
    await this.usersService.touchLastSignedIn(this.toId(user));

    return { accessToken: this.signJwt(user), user: toUserResponse(user) };
  }

  /**
   * Validates backoffice admin credentials (email/password only — no
   * Google, no refresh tokens) and returns a signed JWT carrying
   * `role: 'admin'` so it can be told apart from a regular user token.
   * Uses the same generic "invalid credentials" message for both a
   * non-existent email and a wrong password, to avoid leaking which one
   * failed (same approach as `login` above).
   */
  async loginBackoffice(
    email: string,
    password: string,
  ): Promise<BackofficeAuthResult> {
    const admin = await this.adminsService.findByEmail(email);
    if (!admin) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    return {
      accessToken: this.signAdminJwt(admin),
      admin: { id: this.toId(admin), email: admin.email },
    };
  }

  private async verifyGoogleToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        firstName: payload.given_name ?? payload.email,
        lastName: payload.family_name ?? '',
        picture: payload.picture,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Google ID token');
    }
  }

  private signJwt(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: this.toId(user),
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  private signAdminJwt(admin: AdminDocument): string {
    const payload: JwtPayload = {
      sub: this.toId(admin),
      email: admin.email,
      role: 'admin',
    };
    return this.jwtService.sign(payload);
  }

  private toId(doc: UserDocument | AdminDocument): string {
    return (doc._id as { toString(): string }).toString();
  }
}
