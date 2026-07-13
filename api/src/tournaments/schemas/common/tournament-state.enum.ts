/**
 * Coarse-grained lifecycle state of a tournament, persisted on
 * `Tournament.state` and ONLY ever transitioned by the backend (the
 * progression engine that runs inside `PATCH /tournaments/match/:matchId`).
 * The frontend must never infer this by counting matches — it just reads it.
 *
 * Set at creation time from `Tournament.format`:
 *   LEAGUE                          -> LEAGUE
 *   GROUP_STAGE_PLUS_ELIMINATION    -> GROUPS
 *   SWISS_PLUS_ELIMINATION          -> SWISS
 *   SINGLE_ELIMINATION              -> KNOCKOUTS
 *
 * Transitions performed by the progression engine:
 *   GROUPS  -> KNOCKOUTS  once every group (and its tiebreaks, if any) is
 *             fully resolved and the knockout bracket has been generated.
 *   SWISS   -> KNOCKOUTS  once exactly `targetQualifiers` teams are
 *             confirmed (regular rounds + play-in, if needed) and the
 *             knockout bracket has been generated.
 *   LEAGUE  -> FINISHED   once every matchday (and every table tiebreak, if
 *             any) is resolved.
 *   KNOCKOUTS -> FINISHED once the final (and 3rd-place match, if any) is
 *             played.
 * `LEAGUE`, `GROUPS` and `SWISS` never transition directly to `FINISHED` —
 * `GROUPS`/`SWISS` always pass through `KNOCKOUTS` first.
 *
 * `DELETED` is a special-cased terminal state: it is NEVER set by the
 * progression engine and has no place in the transition table above. It is
 * set exclusively by `DELETE /tournaments/:id` (soft delete — the document
 * is kept, alongside `Tournament.deletedAt`, for future statistics; see
 * tournaments.service.ts). Once a tournament is `DELETED` it is treated as
 * not found by every other read/write endpoint.
 */
export enum TournamentState {
  LEAGUE = 'LEAGUE',
  GROUPS = 'GROUPS',
  SWISS = 'SWISS',
  KNOCKOUTS = 'KNOCKOUTS',
  FINISHED = 'FINISHED',
  DELETED = 'DELETED',
}
