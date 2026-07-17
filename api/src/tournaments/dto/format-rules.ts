import { TournamentFormat } from '../schemas/common/tournament-format.enum';

/**
 * Single source of truth for the team-count / group-cap rules that back the
 * class-level design comments in each `*.schema.ts` (bracket, league,
 * group-stage, swiss-stage). Kept here — rather than duplicated in the DTO
 * and the service — so validation, fixture generation and the
 * `GET /utils/tournament-formats` contract can never drift apart.
 *
 * SINGLE_ELIMINATION and GROUP_STAGE_PLUS_ELIMINATION are validated by
 * RANGE (`teamCount` is free within `[min, max]`), never a closed table of
 * "supported" values — see `TEAM_RANGE_BY_FORMAT` and
 * `computeGroupDistribution` below. SWISS_PLUS_ELIMINATION keeps its closed
 * set (`SWISS_TEAM_COUNTS`) and LEAGUE keeps its own range — neither format
 * is in scope for the dynamic-team-count change.
 */

/** `teamCount` range (inclusive) for the formats that accept a free integer
 *  within a range instead of a closed set. Absent for SWISS_PLUS_ELIMINATION
 *  (see `SWISS_TEAM_COUNTS`). */
export const TEAM_RANGE_BY_FORMAT: Readonly<
  Partial<Record<TournamentFormat, { min: number; max: number }>>
> = {
  [TournamentFormat.SINGLE_ELIMINATION]: { min: 4, max: 64 },
  [TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION]: { min: 6, max: 64 },
  [TournamentFormat.LEAGUE]: { min: 4, max: 30 },
};

/** Back-compat aliases used across the codebase for the LEAGUE range. */
export const LEAGUE_MIN_TEAMS =
  TEAM_RANGE_BY_FORMAT[TournamentFormat.LEAGUE]!.min;
export const LEAGUE_MAX_TEAMS =
  TEAM_RANGE_BY_FORMAT[TournamentFormat.LEAGUE]!.max;

/**
 * SWISS_PLUS_ELIMINATION keeps its closed, hand-picked set of supported
 * `teamCount` values (unaffected by this change — see `SWISS_TARGET_QUALIFIERS`
 * for the qualifier count that goes with each one).
 */
export const SWISS_TEAM_COUNTS: readonly number[] = [8, 10, 12, 16, 24, 32];

/** Minimum allowed `groupCap` (max teams per group) for
 *  GROUP_STAGE_PLUS_ELIMINATION — see `computeGroupDistribution`. */
export const GROUP_CAP_MIN = 3;

/**
 * Formats that require every team to be linked to a real player (no CPU/AI
 * teams), per league.schema.ts and swiss-stage.schema.ts. The other two
 * formats (`SINGLE_ELIMINATION`, `GROUP_STAGE_PLUS_ELIMINATION`) are exactly
 * the ones that accept `aiFill` at creation time.
 */
export const FORMATS_REQUIRING_ALL_TEAMS_ASSIGNED: readonly TournamentFormat[] =
  [TournamentFormat.LEAGUE, TournamentFormat.SWISS_PLUS_ELIMINATION];

/**
 * Formats whose knockout bracket already exists at creation time (so a
 * requested 3rd-place match can be attached directly to `Bracket`). The
 * other two formats (group stage / Swiss) only build their bracket once
 * qualifiers are known, so the 3rd-place-match intent is stashed on
 * `Tournament.thirdPlaceMatch` instead — see draw/draw.service.ts.
 */
export const FORMATS_WITH_IMMEDIATE_BRACKET: readonly TournamentFormat[] = [
  TournamentFormat.SINGLE_ELIMINATION,
];

/** `targetQualifiers` per Swiss `teamCount`: the largest power of two <= teamCount/2. */
export const SWISS_TARGET_QUALIFIERS: Readonly<Record<number, number>> = {
  8: 4,
  10: 4,
  12: 4,
  16: 8,
  24: 8,
  32: 16,
};

/** Smallest power of two >= n. */
export function nextPowerOfTwo(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

// --- Group distribution (balanced, generic — NOT a hardcoded table) -------

export type GroupDistribution =
  | { valid: true; groupCount: number; groupSizes: number[] }
  | { valid: false; reason: string };

/**
 * Balanced distribution of `teamCount` teams into groups of at most
 * `groupCap` teams each, for GROUP_STAGE_PLUS_ELIMINATION:
 *
 *   groupCount = ceil(teamCount / groupCap)
 *   base       = floor(teamCount / groupCount)
 *   remainder  = teamCount % groupCount
 *
 * -> `remainder` groups of `base + 1` teams, `groupCount - remainder` groups
 * of `base` teams. Group sizes therefore never differ by more than 1 and
 * never exceed `groupCap` (e.g. teamCount=10, groupCap=4 -> [4, 3, 3], NEVER
 * [4, 4, 2]; teamCount=7, groupCap=4 -> [4, 3]).
 *
 * A distribution is only valid when `groupCount >= 2` (at least two groups)
 * AND `teamCount >= 3 * groupCount` (no group ends up with fewer than 3
 * teams, the minimum needed for a meaningful round-robin group with a clear
 * top-2). E.g. teamCount=10, groupCap=3 -> groupCount=4, but 10 < 3*4=12, so
 * it's rejected — this is genuinely infeasible, not a gap in a lookup table.
 *
 * Pure/side-effect-free so it can be unit-tested directly and reused by both
 * the service-layer validation and `buildGroupStage`.
 */
export function computeGroupDistribution(
  teamCount: number,
  groupCap: number,
): GroupDistribution {
  const groupCount = Math.ceil(teamCount / groupCap);

  if (groupCount < 2 || teamCount < 3 * groupCount) {
    return {
      valid: false,
      reason:
        `teamCount=${teamCount} cannot be split into groups of at most ` +
        `${groupCap} teams: needs at least 2 groups with at least 3 teams ` +
        `each (that grouping would need groupCount=${groupCount}).`,
    };
  }

  const base = Math.floor(teamCount / groupCount);
  const remainder = teamCount % groupCount;
  const groupSizes = [
    ...Array<number>(remainder).fill(base + 1),
    ...Array<number>(groupCount - remainder).fill(base),
  ];

  return { valid: true, groupCount, groupSizes };
}

// --- AI-fill targets (`aiFill: true`) --------------------------------------

/**
 * Target team count for SINGLE_ELIMINATION when `aiFill=true`: the next
 * power of two >= `realCount` (e.g. 7 -> 8). Never exceeds
 * `TEAM_RANGE_BY_FORMAT[SINGLE_ELIMINATION].max` because that max (64) is
 * itself a power of two and `realCount` is already validated against it.
 */
export function computeEliminationAiFillTeamCount(realCount: number): number {
  return nextPowerOfTwo(realCount);
}

/**
 * Target team count for GROUP_STAGE_PLUS_ELIMINATION when `aiFill=true`: the
 * next multiple of `groupCap` >= `realCount` (e.g. realCount=10, groupCap=4
 * -> 12), capped at the format's max team count. If that natural next
 * multiple would exceed the max, the target is just the max itself — the
 * resulting groups won't all be exactly `groupCap`-sized, but
 * `computeGroupDistribution` still balances them validly.
 */
export function computeGroupStageAiFillTeamCount(
  realCount: number,
  groupCap: number,
): number {
  const maxTeams =
    TEAM_RANGE_BY_FORMAT[TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION]!.max;
  const nextMultiple = Math.ceil(realCount / groupCap) * groupCap;
  return Math.min(nextMultiple, maxTeams);
}
