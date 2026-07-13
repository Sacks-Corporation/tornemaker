import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import {
  buildTiebreakMatches,
  reconcileTieGroup,
  resolveTiebreak,
  SeedLookup,
} from './tiebreak.util';

function playedMatch(
  home: string,
  away: string,
  hg: number,
  ag: number,
): Match {
  return {
    matchId: `${home}-${away}`,
    homeTeamId: home,
    awayTeamId: away,
    isTwoLegged: false,
    legs: [
      {
        console: 'PLAY_5',
        homeGoals: hg,
        awayGoals: ag,
        wentToExtraTime: false,
        wentToPenalties: false,
      },
    ],
    status: MatchStatus.PLAYED,
    isDraw: hg === ag,
    allowsPenalties: false,
  };
}

describe('buildTiebreakMatches', () => {
  it('builds a single match for a 2-way tie', () => {
    const matches = buildTiebreakMatches(['A', 'B']);
    expect(matches).toHaveLength(1);
    expect(matches[0].homeTeamId).toBe('A');
    expect(matches[0].awayTeamId).toBe('B');
    expect(matches[0].allowsPenalties).toBe(false);
  });

  it('builds a triangular round-robin (3 matches) for a 3-way tie', () => {
    const matches = buildTiebreakMatches(['A', 'B', 'C']);
    expect(matches).toHaveLength(3);
    const pairs = matches.map((m) =>
      [m.homeTeamId, m.awayTeamId].sort().join('-'),
    );
    expect(new Set(pairs).size).toBe(3);
  });

  it('builds a quadrangular round-robin (6 matches) for a 4-way tie', () => {
    const matches = buildTiebreakMatches(['A', 'B', 'C', 'D']);
    expect(matches).toHaveLength(6);
    const pairs = new Set(
      matches.map((m) => [m.homeTeamId, m.awayTeamId].sort().join('-')),
    );
    expect(pairs.size).toBe(6);
  });

  it('every generated match has a globally-unique id', () => {
    const matches = buildTiebreakMatches(['A', 'B', 'C', 'D']);
    expect(new Set(matches.map((m) => m.matchId)).size).toBe(matches.length);
  });
});

describe('resolveTiebreak', () => {
  const seeds: SeedLookup[] = [
    { teamId: 'A', seed: 1 },
    { teamId: 'B', seed: 2 },
  ];

  it('resolves a 2-way tie from a single played match', () => {
    const order = resolveTiebreak(
      ['A', 'B'],
      [playedMatch('A', 'B', 2, 0)],
      seeds,
    );
    expect(order).toEqual(['A', 'B']);
  });

  it('falls back to seed when the tiebreak match is itself a draw', () => {
    const order = resolveTiebreak(
      ['A', 'B'],
      [playedMatch('A', 'B', 1, 1)],
      seeds,
    );
    // Still tied on points/GD/GF/wins after the tiebreak match -> seed (A=1 < B=2).
    expect(order).toEqual(['A', 'B']);
  });
});

describe('reconcileTieGroup', () => {
  const seeds: SeedLookup[] = [
    { teamId: 'A', seed: 1 },
    { teamId: 'B', seed: 2 },
  ];

  it('generates tiebreak matches on first call and reports unresolved', () => {
    const pool: Match[] = [];
    const result = reconcileTieGroup(['A', 'B'], pool, seeds);
    expect(result.resolved).toBe(false);
    expect(result.generated).toBe(true);
    expect(pool).toHaveLength(1);
  });

  it('does not regenerate matches on a subsequent call (idempotent)', () => {
    const pool: Match[] = [];
    reconcileTieGroup(['A', 'B'], pool, seeds);
    const second = reconcileTieGroup(['A', 'B'], pool, seeds);
    expect(second.generated).toBe(false);
    expect(pool).toHaveLength(1);
  });

  it('resolves once the generated match is played', () => {
    const pool: Match[] = [];
    reconcileTieGroup(['A', 'B'], pool, seeds);
    pool[0].legs.push({
      console: 'PLAY_5',
      homeGoals: 3,
      awayGoals: 1,
      wentToExtraTime: false,
      wentToPenalties: false,
    });
    pool[0].status = MatchStatus.PLAYED;
    pool[0].winnerTeamId = pool[0].homeTeamId;

    const result = reconcileTieGroup(['A', 'B'], pool, seeds);
    expect(result.resolved).toBe(true);
    expect(result.order).toEqual([pool[0].homeTeamId, pool[0].awayTeamId]);
  });

  it('skips generating a match and resolves by seed for an unsupported tie size (>4)', () => {
    const pool: Match[] = [];
    const fiveWaySeeds: SeedLookup[] = [
      { teamId: 'A', seed: 3 },
      { teamId: 'B', seed: 1 },
      { teamId: 'C', seed: 5 },
      { teamId: 'D', seed: 2 },
      { teamId: 'E', seed: 4 },
    ];
    const result = reconcileTieGroup(
      ['A', 'B', 'C', 'D', 'E'],
      pool,
      fiveWaySeeds,
    );
    expect(result.resolved).toBe(true);
    expect(result.generated).toBe(false);
    expect(pool).toHaveLength(0);
    expect(result.order).toEqual(['B', 'D', 'A', 'E', 'C']);
  });
});
