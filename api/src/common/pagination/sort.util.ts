import { SortDirection } from './sort-direction.enum';

/** Mongo `$sort` stage / `.sort(...)` argument shape: DB field -> 1 | -1. */
export type MongoSortStage = Record<string, 1 | -1>;

/**
 * Maps API-facing `sortField` values to the real DB field(s) they sort on.
 * A value can be:
 *   - a single DB field, e.g. `{ email: 'email' }`, or
 *   - an array of DB fields applied in order with the SAME direction, for a
 *     secondary tie-breaker, e.g. `{ name: ['firstName', 'lastName'] }`.
 *
 * This is the ONLY thing a caller-supplied `sortField` is ever checked
 * against — see `resolveSortStage`.
 */
export type SortWhitelist = Record<string, string | string[]>;

/** Endpoint's fallback order, used whenever `sortField` is absent or not a
 *  whitelist key. */
export interface SortDefault {
  field: string;
  direction: SortDirection;
}

/**
 * Resolves the `sortField`/`sortDirection` query params (see
 * `PaginationQueryDto`) into the Mongo sort object every paginated endpoint
 * needs — used both with `.sort(...)` on a `find()` query and with a
 * `$sort` aggregation stage. See
 * `.claude/skills/paginated-endpoint/SKILL.md` for the full contract.
 *
 * SECURITY: the caller-supplied `sortField` is NEVER forwarded to Mongo
 * as-is. It is only ever used as a LOOKUP KEY into `whitelist`
 * (fieldApi -> fieldDb); arbitrary/unknown field names can never reach the
 * `$sort` stage. If `sortField` is missing or not a whitelist key, this
 * falls back to `default_` — an invalid `sortField` must never 400, it just
 * degrades gracefully to the endpoint's default order (per design: this
 * stays robust, not strict).
 */
export function resolveSortStage(
  sortField: string | undefined,
  sortDirection: SortDirection | undefined,
  whitelist: SortWhitelist,
  default_: SortDefault,
): MongoSortStage {
  if (
    sortField !== undefined &&
    Object.prototype.hasOwnProperty.call(whitelist, sortField)
  ) {
    const direction = sortDirection === SortDirection.DESC ? -1 : 1;
    const dbFields = whitelist[sortField];
    const fields = Array.isArray(dbFields) ? dbFields : [dbFields];

    const stage: MongoSortStage = {};
    for (const dbField of fields) {
      stage[dbField] = direction;
    }
    return stage;
  }

  return {
    [default_.field]: default_.direction === SortDirection.DESC ? -1 : 1,
  };
}
