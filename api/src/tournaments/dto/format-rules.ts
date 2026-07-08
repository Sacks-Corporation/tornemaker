import { MatchMode } from '../schemas/common/match-mode.enum';
import { TournamentFormat } from '../schemas/common/tournament-format.enum';

/**
 * Single source of truth for the closed team-count / group-size rules that
 * back the class-level design comments in each `*.schema.ts` (bracket,
 * league, group-stage, swiss-stage). Kept here — rather than duplicated in
 * the DTO and the service — so validation and fixture generation can never
 * drift apart.
 */

/** Closed set of valid `teamCount` values per format (null = range-checked instead). */
export const VALID_TEAM_COUNTS: Record<
  TournamentFormat,
  readonly number[] | null
> = {
  [TournamentFormat.SINGLE_ELIMINATION]: [6, 8, 10, 12, 16, 20, 24, 28, 32],
  [TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION]: [
    6, 8, 12, 16, 20, 24, 28, 32,
  ],
  [TournamentFormat.LEAGUE]: null,
  [TournamentFormat.SWISS_PLUS_ELIMINATION]: [8, 10, 12, 16, 24, 32],
};

export const LEAGUE_MIN_TEAMS = 4;
export const LEAGUE_MAX_TEAMS = 30;

/**
 * Valid `groupSize` option(s) for every supported `teamCount` under
 * GROUP_STAGE_PLUS_ELIMINATION, per the worked cases documented on
 * `group-stage.schema.ts`. Notably `20` only allows `groupSize=5` — `20/4`
 * (5 groups, 10 direct qualifiers) is explicitly NOT supported because it
 * can't reach a clean power-of-two bracket.
 */
export const GROUP_SIZE_OPTIONS_BY_TEAM_COUNT: Readonly<
  Record<number, readonly number[]>
> = {
  6: [3],
  8: [4],
  12: [3, 4],
  16: [4],
  20: [5],
  24: [3, 4],
  28: [4],
  32: [4],
};

/** How many real players make up one team, per match mode. */
export const PLAYERS_PER_TEAM: Record<MatchMode, number> = {
  [MatchMode.ONE_VS_ONE]: 1,
  [MatchMode.TWO_VS_TWO]: 2,
  [MatchMode.THREE_VS_THREE]: 3,
};

/**
 * Formats that require every team to be linked to a real player (no CPU/AI
 * teams), per league.schema.ts and swiss-stage.schema.ts.
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

/**
 * How many "best third-placed" teams must advance so the knockout bracket
 * closes on a power of two: `nextPowerOfTwo(2 * groupCount) - 2 * groupCount`.
 * Reproduces every worked case on group-stage.schema.ts (e.g. 12/4 -> 3
 * groups -> 2 slots, 24/4 -> 6 groups -> 4 slots, 28/4 -> 7 groups -> 2
 * slots, every other supported combination -> 0).
 */
export function computeBestThirdPlaceSlots(groupCount: number): number {
  const directQualifiers = 2 * groupCount;
  return nextPowerOfTwo(directQualifiers) - directQualifiers;
}
