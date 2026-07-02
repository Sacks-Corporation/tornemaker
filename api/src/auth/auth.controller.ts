import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import type { UserDocument } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/google
   *
   * Receives a Google ID token from the client (obtained after the user
   * completes Google Sign-In on the frontend), verifies it with Google,
   * maps/creates the user in our database, and returns our own JWT.
   *
   * Body: { idToken: string }
   * Response: { accessToken: string }
   */
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleAuthDto): Promise<{ accessToken: string }> {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  /**
   * GET /auth/me
   *
   * Protected endpoint — requires a valid JWT in the Authorization header.
   * Returns the authenticated user's profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: UserDocument }): UserDocument {
    return req.user;
  }
}
