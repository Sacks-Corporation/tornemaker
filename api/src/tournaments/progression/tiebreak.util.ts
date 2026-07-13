import { Types } from 'mongoose';
import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { circleMethodRounds } from '../draw/round-robin.util';
import {
  computeBaseStandings,
  sortAndRank,
  StandingsPointsRules,
} from './standings.util';

/** Classic 3/1/0 scheme, used for every tiebreak mini-table (see class docs). */
export const TIEBREAK_POINTS_RULES: StandingsPointsRules = {
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

/**
 * Builds the tiebreak match(es) for a group of teams tied on the base table
 * criteria: a single match if 2 teams are tied, a full round-robin
 * (triangular/quadrangular) if 3 or 4 are tied. These always admit draws
 * (league rules — `allowsPenalties: false`), per the business rule.
 */
export function buildTiebreakMatches(teamIds: string[]): Match[] {
  if (teamIds.length < 2) {
    throw new Error('buildTiebreakMatches requires at least 2 tied teams');
  }

  if (teamIds.length === 2) {
    return [
      {
        matchId: new Types.ObjectId().toString(),
        homeTeamId: teamIds[0],
        awayTeamId: teamIds[1],
        isTwoLegged: false,
        legs: [],
        status: MatchStatus.SCHEDULED,
        isDraw: false,
        allowsPenalties: false,
      },
    ];
  }

  // 3 or 4 teams: full round-robin (circle method) among just the tied teams.
  const rounds = circleMethodRounds(teamIds);
  const matches: Match[] = [];
  for (const pairs of rounds) {
    for (const [home, away] of pairs) {
      matches.push({
        matchId: new Types.ObjectId().toString(),
        homeTeamId: home,
        awayTeamId: away,
        isTwoLegged: false,
        legs: [],
        status: MatchStatus.SCHEDULED,
        isDraw: false,
        allowsPenalties: false,
      });
    }
  }
  return matches;
}

/** Local team info needed only as the last-resort tiebreak fallback. */
export interface SeedLookup {
  teamId: string;
  seed?: number;
}

/**
 * Resolves the final order of a tied group of teams once (all of) their
 * tiebreak matches have been played: re-applies the same 4-criteria
 * comparison (points -> GD -> GF -> wins) using ONLY the tiebreak matches;
 * any team(s) still tied after that are ordered by `seed` ascending (lower
 * seed = better) as the last-resort fallback. Returns teamIds best-to-worst.
 */
export function resolveTiebreak(
  teamIds: string[],
  tiebreakMatches: Match[],
  seeds: SeedLookup[],
): string[] {
  const baseStandings = computeBaseStandings(
    teamIds,
    tiebreakMatches,
    TIEBREAK_POINTS_RULES,
  );
  const { standings, tieGroups } = sortAndRank(baseStandings);

  if (tieGroups.length === 0) {
    return standings.map((s) => s.teamId);
  }

  const seedByTeam = new Map(seeds.map((s) => [s.teamId, s.seed ?? Infinity]));
  const stillTied = new Set(tieGroups.flatMap((g) => g.teamIds));

  const finalOrder = [...standings];
  finalOrder.sort((a, b) => {
    const cmp =
      (a.rank ?? 0) - (b.rank ?? 0) ||
      (stillTied.has(a.teamId) && stillTied.has(b.teamId)
        ? (seedByTeam.get(a.teamId) ?? Infinity) -
          (seedByTeam.get(b.teamId) ?? Infinity)
        : 0);
    return cmp;
  });

  return finalOrder.map((s) => s.teamId);
}

/** True whenever `teamIds.length` is 2, 3 or 4 (the only sizes supported by a playable tiebreak). */
export function isSupportedTieSize(teamIds: string[]): boolean {
  return teamIds.length >= 2 && teamIds.length <= 4;
}

export interface TieReconciliation {
  /** Best-to-worst order within just this tie group. */
  order: string[];
  /** True once every needed tiebreak match (if any) is played. */
  resolved: boolean;
  /** True if new tiebreak match(es) were appended to `tiebreakMatchesPool` this call. */
  generated: boolean;
}

/**
 * Tries to resolve one tie group against a pool of tiebreak matches
 * (`LeagueStage.tiebreakMatches` or `Group.tiebreakMatches`):
 *   - If more than 4 teams are tied (unsupported tiebreak size), resolves
 *     immediately by seed — no match is generated for this edge case.
 *   - If no tiebreak matches exist yet for these teams, generates them
 *     (pushed into `tiebreakMatchesPool`, mutated in place) and reports
 *     `resolved: false`.
 *   - If they exist but aren't all played yet, reports `resolved: false`.
 *   - If they're all played, resolves the final order (falling back to seed
 *     for anything still tied) and reports `resolved: true`.
 */
export function reconcileTieGroup(
  teamIds: string[],
  tiebreakMatchesPool: Match[],
  seeds: SeedLookup[],
): TieReconciliation {
  if (!isSupportedTieSize(teamIds)) {
    const seedByTeam = new Map(
      seeds.map((s) => [s.teamId, s.seed ?? Infinity]),
    );
    const order = [...teamIds].sort(
      (a, b) =>
        (seedByTeam.get(a) ?? Infinity) - (seedByTeam.get(b) ?? Infinity),
    );
    return { order, resolved: true, generated: false };
  }

  const relevant = tiebreakMatchesPool.filter(
    (m) =>
      m.homeTeamId !== undefined &&
      m.awayTeamId !== undefined &&
      teamIds.includes(m.homeTeamId) &&
      teamIds.includes(m.awayTeamId),
  );

  if (relevant.length === 0) {
    tiebreakMatchesPool.push(...buildTiebreakMatches(teamIds));
    return { order: teamIds, resolved: false, generated: true };
  }

  const allPlayed = relevant.every(
    (m) => m.status === MatchStatus.PLAYED || m.status === MatchStatus.WALKOVER,
  );
  if (!allPlayed) {
    return { order: teamIds, resolved: false, generated: false };
  }

  return {
    order: resolveTiebreak(teamIds, relevant, seeds),
    resolved: true,
    generated: false,
  };
}
