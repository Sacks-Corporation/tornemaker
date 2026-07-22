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
import type { AuthResult, BackofficeAuthResult } from './auth.service';
import { BackofficeLoginDto } from './dto/backoffice-login.dto';
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
   * LOGIN with Google. Receives a Google ID token from the client (obtained
   * after the user completes Google Sign-In on the frontend), verifies it
   * with Google, and maps/links it against an EXISTING user in our
   * database. Does NOT create a user: if this Google identity has no
   * account yet, rejects with 401 and `message: 'USER_NOT_REGISTERED'` —
   * the frontend should catch that and offer `POST /auth/google/register`.
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
   * POST /auth/google/register
   *
   * REGISTER with Google. Same Google ID token verification as
   * `POST /auth/google`, but creates the user in our database when this
   * Google identity doesn't exist yet (or links Google to a matching local
   * account by email). If the account already exists, it just signs the
   * user in (idempotent) — see `AuthService.registerWithGoogle` for why.
   *
   * Body: { idToken: string }
   * Response: { accessToken, user }
   */
  @HttpCode(HttpStatus.OK)
  @Post('google/register')
  registerWithGoogle(@Body() dto: GoogleAuthDto): Promise<AuthResult> {
    return this.authService.registerWithGoogle(dto.idToken);
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

  /**
   * POST /auth/backoffice/login
   *
   * Backoffice admin login: email/password only (bcrypt hash comparison
   * against the separate `admins` collection) — no Google, no refresh
   * tokens. The `backoffice/` segment just distinguishes this from the
   * regular user login above; both live here in AuthController because both
   * are authentication. Same generic "invalid credentials" message for both
   * a non-existent email and a wrong password, to avoid leaking which one
   * failed. Returns our JWT (with a `role: 'admin'` claim so it can be told
   * apart from a regular user token) plus the admin's public profile.
   *
   * Body: { email, password }
   * Response (201, default Nest status for POST): { accessToken, admin: { id, email } }
   */
  @Post('backoffice/login')
  loginBackoffice(
    @Body() dto: BackofficeLoginDto,
  ): Promise<BackofficeAuthResult> {
    return this.authService.loginBackoffice(dto.email, dto.password);
  }
}
