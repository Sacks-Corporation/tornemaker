import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { UserDocument } from '../users/schemas/user.schema';
import { toUserResponse } from '../users/user-response';
import type { UserResponse } from '../users/user-response';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Registers a new local (email/password) user and returns our JWT.
   * Body: { firstName, lastName, email, password }
   * Response: { accessToken, user }
   */
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   *
   * Validates local (email/password) credentials and returns our JWT.
   * Body: { email, password }
   * Response: { accessToken, user }
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto.email, dto.password);
  }

  /**
   * POST /auth/google
   *
   * Receives a Google ID token from the client (obtained after the user
   * completes Google Sign-In on the frontend), verifies it with Google,
   * maps/creates/links the user in our database, and returns our own JWT.
   *
   * Body: { idToken: string }
   * Response: { accessToken, user }
   */
  @HttpCode(HttpStatus.OK)
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleAuthDto): Promise<AuthResult> {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  /**
   * GET /auth/me
   *
   * Protected endpoint — requires a valid JWT in the Authorization header.
   * Returns the authenticated user's public profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: UserDocument }): UserResponse {
    return toUserResponse(req.user);
  }
}
