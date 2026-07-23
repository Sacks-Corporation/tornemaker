// `@Type(() => Number)` below needs `Reflect.getMetadata` at decorator-
// application time. In the running app this is always already loaded (Nest's
// own `@nestjs/common`/`@nestjs/core` import `reflect-metadata` as a side
// effect before any decorator runs), but a plain unit test that reaches this
// file WITHOUT going through Nest bootstrap first (e.g. one that imports
// `SortDirection` as a real value, not just as a type) can hit this module
// before that happens. Importing it here — idempotent, side-effect only —
// makes this DTO self-sufficient regardless of import order.
import 'reflect-metadata';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SortDirection } from './sort-direction.enum';

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

  /**
   * API-facing field name to sort by, e.g. `name`/`email`/`createdAt`. REQUIRED
   * on every paginated request — a request missing it fails validation (400)
   * before it ever reaches a service. Each endpoint defines its OWN whitelist
   * mapping this to the real DB field(s) (see `resolveSortStage`/
   * `SortWhitelist` in `sort.util.ts`) — this is intentionally just a plain
   * string here, never validated against a fixed enum, because the set of
   * sortable fields differs per endpoint. Once present, an unknown/
   * unsupported VALUE still never 400s: it falls back to that endpoint's
   * default order (see `.claude/skills/paginated-endpoint/SKILL.md`) — only
   * its ABSENCE is a validation error.
   */
  @IsString()
  @IsNotEmpty()
  sortField: string;

  /** Direction for `sortField`. REQUIRED on every paginated request — a
   *  request missing it fails validation (400). `@IsIn` already rejects
   *  `undefined`/absence on its own (not part of the allowed value set), but
   *  `@IsNotEmpty` is added for an explicit, readable error on an empty
   *  string too. */
  @IsIn(Object.values(SortDirection))
  @IsNotEmpty()
  sortDirection: SortDirection;
}
