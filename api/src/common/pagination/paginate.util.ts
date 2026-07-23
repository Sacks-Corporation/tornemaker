import { PaginatedResult } from './paginated-result.interface';

/** `.skip()` value for a given 1-based `page`/`pageSize` pair. */
export function getPaginationSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Builds the `{ data, total, page, pageSize }` response every paginated
 * endpoint must return (see `.claude/skills/paginated-endpoint/SKILL.md`).
 * Services should always go through this helper instead of building the
 * object by hand, so the contract with the frontend never drifts.
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { data, total, page, pageSize };
}
