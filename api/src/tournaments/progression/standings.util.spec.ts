import { GameConsole } from '../schemas/common/console.enum';
import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import {
  compareStandings,
  computeBaseStandings,
  sortAndRank,
  StandingsPointsRules,
} from './standings.util';

const RULES: StandingsPointsRules = {
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

function playedMatch(
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number,
): Match {
  return {
    matchId: `${home}-${away}`,
    homeTeamId: home,
    awayTeamId: away,
    isTwoLegged: false,
    legs: [
      {
        console: GameConsole.PLAY_5,
        homeGoals,
        awayGoals,
        wentToExtraTime: false,
        wentToPenalties: false,
      },
    ],
    status: MatchStatus.PLAYED,
    isDraw: homeGoals === awayGoals,
    allowsPenalties: false,
  };
}

describe('computeBaseStandings', () => {
  it('derives win/draw/loss points and goal stats from played matches only', () => {
    const teamIds = ['A', 'B', 'C'];
    const matches = [
      playedMatch('A', 'B', 2, 0), // A wins
      playedMatch('B', 'C', 1, 1), // draw
      // A vs C not played yet
    ];

    const standings = computeBaseStandings(teamIds, matches, RULES);
    const byId = new Map(standings.map((s) => [s.teamId, s]));

    expect(byId.get('A')).toMatchObject({
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 2,
      goalsAgainst: 0,
      goalDifference: 2,
      points: 3,
    });
    expect(byId.get('B')).toMatchObject({
      played: 2,
      won: 0,
      drawn: 1,
      lost: 1,
      goalsFor: 1,
      goalsAgainst: 3,
      goalDifference: -2,
      points: 1,
    });
    expect(byId.get('C')).toMatchObject({
      played: 1,
      won: 0,
      drawn: 1,
      lost: 0,
      points: 1,
    });
  });

  it('ignores unplayed matches (no legs recorded)', () => {
    const teamIds = ['A', 'B'];
    const unplayed: Match = {
      matchId: 'A-B',
      homeTeamId: 'A',
      awayTeamId: 'B',
      isTwoLegged: false,
      legs: [],
      status: MatchStatus.SCHEDULED,
      isDraw: false,
      allowsPenalties: false,
    };
    const standings = computeBaseStandings(teamIds, [unplayed], RULES);
    expect(standings.every((s) => s.played === 0)).toBe(true);
  });
});

describe('compareStandings / sortAndRank', () => {
  it('orders by points -> goal difference -> goals for -> wins', () => {
    const standings = [
      {
        teamId: 'low-points',
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 0,
        goalsAgainst: 3,
        goalDifference: -3,
        points: 0,
      },
      {
        teamId: 'high-points',
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 3,
        goalsAgainst: 0,
        goalDifference: 3,
        points: 3,
      },
      {
        teamId: 'mid-gd',
        played: 1,
        won: 0,
        drawn: 1,
        lost: 0,
        goalsFor: 1,
        goalsAgainst: 1,
        goalDifference: 0,
        points: 1,
      },
    ];

    const { standings: sorted } = sortAndRank(standings);
    expect(sorted.map((s) => s.teamId)).toEqual([
      'high-points',
      'mid-gd',
      'low-points',
    ]);
    expect(sorted.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it('reports a tie group when points/GD/GF/wins are all equal', () => {
    const standings = [
      {
        teamId: 'A',
        played: 2,
        won: 1,
        drawn: 0,
        lost: 1,
        goalsFor: 3,
        goalsAgainst: 2,
        goalDifference: 1,
        points: 3,
      },
      {
        teamId: 'B',
        played: 2,
        won: 1,
        drawn: 0,
        lost: 1,
        goalsFor: 3,
        goalsAgainst: 2,
        goalDifference: 1,
        points: 3,
      },
      {
        teamId: 'C',
        played: 2,
        won: 0,
        drawn: 0,
        lost: 2,
        goalsFor: 0,
        goalsAgainst: 5,
        goalDifference: -5,
        points: 0,
      },
    ];

    const { tieGroups } = sortAndRank(standings);
    expect(tieGroups).toHaveLength(1);
    expect(tieGroups[0]).toEqual({
      fromRank: 1,
      toRank: 2,
      teamIds: ['A', 'B'],
    });
  });

  it('compareStandings breaks ties by wins before declaring a full tie', () => {
    const a = {
      teamId: 'A',
      played: 3,
      won: 2,
      drawn: 0,
      lost: 1,
      goalsFor: 4,
      goalsAgainst: 2,
      goalDifference: 2,
      points: 6,
    };
    const b = {
      teamId: 'B',
      played: 3,
      won: 1,
      drawn: 3,
      lost: 0,
      goalsFor: 4,
      goalsAgainst: 2,
      goalDifference: 2,
      points: 6,
    };
    // Same points, GD, GF -> decided by wins.
    expect(compareStandings(a, b)).toBeLessThan(0);
  });
});
