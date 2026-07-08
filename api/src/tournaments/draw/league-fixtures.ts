import { MatchStatus } from '../schemas/common/match-status.enum';
import { Match } from '../schemas/common/match.schema';
import { Standing } from '../schemas/common/standing.schema';
import { LeagueMatchday, LeagueStage } from '../schemas/league.schema';
import { circleMethodRounds } from './round-robin.util';
import { SeededTeam } from './types';

function buildMatch(
  roundNumber: number,
  indexInRound: number,
  home: string,
  away: string,
): Match {
  return {
    matchId: `LEAGUE-R${roundNumber}-M${indexInRound + 1}`,
    homeTeamId: home,
    awayTeamId: away,
    isTwoLegged: false,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
  };
}

/**
 * Builds the full LEAGUE stage: round-robin matchdays (single or double
 * round-robin per `twoLegged`, see league.schema.ts — a double round-robin
 * is modeled as a second set of SEPARATE single-leg fixtures with inverted
 * localía, not as two-legged Match ties) plus zeroed-out standings.
 */
export function buildLeagueStage(
  teams: SeededTeam[],
  twoLegged: boolean,
): LeagueStage {
  const ids = teams.map((t) => t.hexId);
  const firstLegRounds = circleMethodRounds(ids);

  const matchdays: LeagueMatchday[] = [];
  let roundNumber = 1;

  for (const pairs of firstLegRounds) {
    matchdays.push({
      roundNumber,
      matches: pairs.map(([home, away], i) =>
        buildMatch(roundNumber, i, home, away),
      ),
    });
    roundNumber++;
  }

  if (twoLegged) {
    for (const pairs of firstLegRounds) {
      matchdays.push({
        roundNumber,
        // Second leg: same pairing, localía inverted, separate fixtures.
        matches: pairs.map(([home, away], i) =>
          buildMatch(roundNumber, i, away, home),
        ),
      });
      roundNumber++;
    }
  }

  const standings: Standing[] = teams.map((t) => ({
    teamId: t.hexId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  return {
    doubleRound: twoLegged,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    matchdays,
    standings,
  };
}
