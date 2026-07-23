/**
 * Shape returned by EVERY paginated endpoint in this API. Mirrors
 * `PaginatedResponse<T>` in `backoffice/src/types/common.types.ts` — if this
 * shape ever changes, update both sides together.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
