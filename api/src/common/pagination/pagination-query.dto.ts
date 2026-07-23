import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Default `pageSize` when the caller does not send one (see `PaginationQueryDto`). */
export const DEFAULT_PAGE_SIZE = 20;

/** Hard upper bound on `pageSize`, regardless of what the caller requests. */
export const MAX_PAGE_SIZE = 100;

/**
 * Shared query DTO for every paginated `GET` endpoint — see
 * `.claude/skills/paginated-endpoint/SKILL.md`. `page`/`pageSize` arrive as
 * strings on the query string; `@Type(() => Number)` (class-transformer)
 * converts them to numbers BEFORE `class-validator` runs. This only works
 * because the global `ValidationPipe` in `main.ts` is configured with
 * `transform: true`.
 *
 * When an endpoint needs extra filters alongside pagination, `extend` this
 * DTO instead of redeclaring `page`/`pageSize`, e.g.:
 *
 *   export class ListTournamentsQueryDto extends PaginationQueryDto {
 *     @IsOptional() @IsEnum(TournamentState) state?: TournamentState;
 *   }
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;
}
