import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
