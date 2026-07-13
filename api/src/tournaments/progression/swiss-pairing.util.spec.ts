import { SwissParticipant } from '../schemas/swiss-stage.schema';
import {
  applySwissMatchResult,
  buildPlayInMatches,
  pairNextSwissRound,
} from './swiss-pairing.util';

function participant(
  teamId: string,
  overrides: Partial<SwissParticipant> = {},
): SwissParticipant {
  return {
    teamId,
    wins: 0,
    losses: 0,
    isQualified: false,
    isEliminated: false,
    opponentTeamIds: [],
    gameDifferential: 0,
    ...overrides,
  };
}

describe('applySwissMatchResult', () => {
  it('increments wins/losses, records opponents and updates game differential', () => {
    const home = participant('A');
    const away = participant('B');
    applySwissMatchResult(home, away, 2, 0, 'A', 3, 3);

    expect(home.wins).toBe(1);
    expect(home.losses).toBe(0);
    expect(home.gameDifferential).toBe(2);
    expect(away.wins).toBe(0);
    expect(away.losses).toBe(1);
    expect(away.gameDifferential).toBe(-2);
    expect(home.opponentTeamIds).toEqual(['B']);
    expect(away.opponentTeamIds).toEqual(['A']);
  });

  it('marks a participant qualified once it reaches winsToQualify', () => {
    const home = participant('A', { wins: 2 });
    const away = participant('B');
    applySwissMatchResult(home, away, 1, 0, 'A', 3, 3);
    expect(home.wins).toBe(3);
    expect(home.isQualified).toBe(true);
  });

  it('marks a participant eliminated once it reaches lossesToEliminate', () => {
    const home = participant('A');
    const away = participant('B', { losses: 2 });
    applySwissMatchResult(home, away, 1, 0, 'A', 3, 3);
    expect(away.losses).toBe(3);
    expect(away.isEliminated).toBe(true);
  });
});

describe('pairNextSwissRound', () => {
  it('pairs everyone within the same score group', () => {
    const participants = [
      participant('A', { wins: 1 }),
      participant('B', { wins: 1 }),
      participant('C', { wins: 0, losses: 1 }),
      participant('D', { wins: 0, losses: 1 }),
    ];
    const matches = pairNextSwissRound(participants);
    expect(matches).toHaveLength(2);
    const pairs = matches!.map((m) =>
      [m.homeTeamId, m.awayTeamId].sort().join('-'),
    );
    expect(pairs).toContain(['A', 'B'].sort().join('-'));
    expect(pairs).toContain(['C', 'D'].sort().join('-'));
  });

  it('excludes qualified and eliminated participants', () => {
    const participants = [
      participant('A', { wins: 3, isQualified: true }),
      participant('B', { losses: 3, isEliminated: true }),
      participant('C', { wins: 1 }),
      participant('D', { wins: 1 }),
    ];
    const matches = pairNextSwissRound(participants);
    expect(matches).toHaveLength(1);
    expect([matches![0].homeTeamId, matches![0].awayTeamId].sort()).toEqual([
      'C',
      'D',
    ]);
  });

  it('avoids a rematch when an alternative pairing exists', () => {
    const participants = [
      participant('A', { wins: 1, opponentTeamIds: ['B'] }),
      participant('B', { wins: 1, opponentTeamIds: ['A'] }),
      participant('C', { wins: 1, opponentTeamIds: ['D'] }),
      participant('D', { wins: 1, opponentTeamIds: ['C'] }),
    ];
    const matches = pairNextSwissRound(participants);
    const pairs = matches!.map((m) =>
      [m.homeTeamId, m.awayTeamId].sort().join('-'),
    );
    expect(pairs).not.toContain(['A', 'B'].sort().join('-'));
    expect(pairs).not.toContain(['C', 'D'].sort().join('-'));
  });

  it('returns null when nobody is left to pair', () => {
    const participants = [
      participant('A', { isQualified: true }),
      participant('B', { isEliminated: true }),
    ];
    expect(pairNextSwissRound(participants)).toBeNull();
  });

  it('every generated match allows penalties (Swiss never allows a draw to stand)', () => {
    const participants = [participant('A'), participant('B')];
    const matches = pairNextSwissRound(participants);
    expect(matches![0].allowsPenalties).toBe(true);
  });
});

describe('buildPlayInMatches', () => {
  it('returns no matches when qualifiers already match the target', () => {
    expect(buildPlayInMatches(['A', 'B', 'C', 'D'], 4)).toEqual([]);
  });

  it('pairs the lowest-ranked excess qualifiers to trim down to the target', () => {
    // 5 qualifiers, target 4: 1 excess -> last 2 (rank 4 and 5) play in.
    const matches = buildPlayInMatches(['A', 'B', 'C', 'D', 'E'], 4);
    expect(matches).toHaveLength(1);
    expect(matches[0].homeTeamId).toBe('D');
    expect(matches[0].awayTeamId).toBe('E');
    expect(matches[0].allowsPenalties).toBe(true);
  });
});
