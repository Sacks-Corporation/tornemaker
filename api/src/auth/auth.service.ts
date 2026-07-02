import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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
   * Verifies a Google ID token, maps/creates the user in our database,
   * and returns our own signed JWT.
   */
  async loginWithGoogle(idToken: string): Promise<{ accessToken: string }> {
    const googleUser = await this.verifyGoogleToken(idToken);

    const user = await this.usersService.findOrCreate({
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    return { accessToken: this.signJwt(user) };
  }

  private async verifyGoogleToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    name: string;
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
        name: payload.name ?? payload.email,
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
