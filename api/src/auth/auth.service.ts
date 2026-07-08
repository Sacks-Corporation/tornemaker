import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { toUserResponse, UserResponse } from '../users/user-response';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthResult {
  accessToken: string;
  user: UserResponse;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
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

    return { accessToken: this.signJwt(user), user: toUserResponse(user) };
  }

  /**
   * Verifies a Google ID token, maps/creates/links the user in our
   * database, and returns our own signed JWT.
   */
  async loginWithGoogle(idToken: string): Promise<AuthResult> {
    const googleUser = await this.verifyGoogleToken(idToken);

    const user = await this.usersService.findOrCreateFromGoogle(googleUser);

    return { accessToken: this.signJwt(user), user: toUserResponse(user) };
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
      sub: (user._id as { toString(): string }).toString(),
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
