import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginatedResult, PaginationQueryDto } from '../common/pagination';
import { UserListItem } from './user-list-item';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users
   *
   * Paginated listing of every user in the system, for the backoffice's
   * users screen — see `.claude/skills/paginated-endpoint/SKILL.md` for the
   * shared `{ data, total, page, pageSize }` contract. Each item's `state`
   * is the EFFECTIVE state (BLOCKED > INACTIVE-by-`lastSignedIn` > ACTIVE),
   * recomputed on every call — see `UsersService.findAllPaginated` /
   * `computeEffectiveUserState`. Never returns `password` or any other
   * internal field.
   *
   * Restricted to backoffice admins: `JwtAuthGuard` authenticates the
   * token (admin or regular user), then `AdminGuard` rejects anything that
   * isn't an admin token with 403 — see both guards for details. This
   * exposes every user's email, so it must never be reachable by a regular
   * end user.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserListItem>> {
    return this.usersService.findAllPaginated(query);
  }

  /**
   * PATCH /users/:id/enable
   *
   * Re-allows a user account to sign in (sets `enabled: true`) — see
   * `User.enabled` and `UsersService.enableUser`. 404s if `id` doesn't
   * match any user. Same admin-only restriction as `GET /users` above
   * (`JwtAuthGuard` + `AdminGuard`): this is a backoffice moderation action,
   * never callable by a regular end user. Returns the updated row in the
   * same `UserListItem` shape as `GET /users`.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/enable')
  enable(@Param('id') id: string): Promise<UserListItem> {
    return this.usersService.enableUser(id);
  }

  /**
   * PATCH /users/:id/disable
   *
   * Blocks a user account from signing in (sets `enabled: false`) — see
   * `User.enabled` and `UsersService.disableUser`. 404s if `id` doesn't
   * match any user. Same admin-only restriction as `GET /users` above
   * (`JwtAuthGuard` + `AdminGuard`). Returns the updated row in the same
   * `UserListItem` shape as `GET /users`.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/disable')
  disable(@Param('id') id: string): Promise<UserListItem> {
    return this.usersService.disableUser(id);
  }
}
