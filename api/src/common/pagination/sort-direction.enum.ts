/**
 * Allowed values for `PaginationQueryDto.sortDirection` — see
 * `.claude/skills/paginated-endpoint/SKILL.md` for the full server-side
 * sorting contract (`sortField` + `sortDirection`, whitelist-based mapping
 * to the real DB field via `resolveSortStage`).
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}
