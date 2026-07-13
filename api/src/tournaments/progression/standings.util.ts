import { Match } from '../schemas/common/match.schema';
import { Standing } from '../schemas/common/standing.schema';

export interface StandingsPointsRules {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
}

/**
 * Recomputes every counting stat (played/won/drawn/lost/goalsFor/
 * goalsAgainst/goalDifference/points) for `teamIds` from scratch, using only
 * PLAYED single-leg matches among `matches` (league fixtures and group-stage
 * fixtures are always single-leg — see league.schema.ts / group-stage.schema.ts
 * — so a "win" for the standings is always a single match's regulation
 * result, never an aggregate/penalty outcome). Does NOT sort/rank — see
 * `sortAndRank` for that, and does NOT include tiebreak matches (those never
 * feed the base table, only the mini-table used to break a tie — see
 * tiebreak.util.ts).
 */
export function computeBaseStandings(
  teamIds: string[],
  matches: Match[],
  rules: StandingsPointsRules,
): Standing[] {
  const byTeam = new Map<string, Standing>();
  for (const teamId of teamIds) {
    byTeam.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.legs.length === 0 || !match.homeTeamId || !match.awayTeamId) {
      continue;
    }
    const leg = match.legs[0];
    const home = byTeam.get(match.homeTeamId);
    const away = byTeam.get(match.awayTeamId);
    if (!home || !away) {
      continue;
    }

    home.played++;
    away.played++;
    home.goalsFor += leg.homeGoals;
    home.goalsAgainst += leg.awayGoals;
    away.goalsFor += leg.awayGoals;
    away.goalsAgainst += leg.homeGoals;

    if (leg.homeGoals > leg.awayGoals) {
      home.won++;
      away.lost++;
      home.points += rules.pointsForWin;
      away.points += rules.pointsForLoss;
    } else if (leg.homeGoals < leg.awayGoals) {
      away.won++;
      home.lost++;
      away.points += rules.pointsForWin;
      home.points += rules.pointsForLoss;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += rules.pointsForDraw;
      away.points += rules.pointsForDraw;
    }
  }

  for (const standing of byTeam.values()) {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  }

  return teamIds.map((id) => byTeam.get(id) as Standing);
}

/**
 * Tie-break comparison order (see Standing schema doc): points desc, goal
 * difference desc, goals for desc, matches won desc. Does NOT resolve
 * further ties (head-to-head is no longer used) — anything still tied after
 * this must go through `tiebreak.util.ts`.
 */
export function compareStandings(a: Standing, b: Standing): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.goalDifference !== b.goalDifference)
    return b.goalDifference - a.goalDifference;
  if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
  if (a.won !== b.won) return b.won - a.won;
  return 0;
}

/** A run of 2+ teams tied on every metric `compareStandings` looks at. */
export interface TieGroup {
  /** Rank range (1-based, inclusive) this tie group occupies in the sorted table. */
  fromRank: number;
  toRank: number;
  teamIds: string[];
}

export interface SortedStandings {
  standings: Standing[]; // sorted, with `rank` populated
  tieGroups: TieGroup[]; // groups of 2+ teams tied after the 4 base criteria
}

/**
 * Sorts standings per `compareStandings`, assigns `rank` (ties share a
 * provisional rank equal to the first position of their group — final,
 * definitive ranks are only meaningful once every `TieGroup` has been
 * resolved via tiebreak matches/seed, see tiebreak.util.ts), and reports
 * every remaining tie group for the caller to decide whether it matters.
 */
export function sortAndRank(standings: Standing[]): SortedStandings {
  const sorted = [...standings].sort(compareStandings);
  const tieGroups: TieGroup[] = [];

  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && compareStandings(sorted[i], sorted[j]) === 0) {
      j++;
    }
    const rank = i + 1;
    for (let k = i; k < j; k++) {
      sorted[k].rank = rank;
    }
    if (j - i > 1) {
      tieGroups.push({
        fromRank: rank,
        toRank: j,
        teamIds: sorted.slice(i, j).map((s) => s.teamId),
      });
    }
    i = j;
  }

  return { standings: sorted, tieGroups };
}
