import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { SwissStage } from '../schemas/swiss-stage.schema';
import { computeSwissDecidedMatchIds } from './serialize';

function playedMatch(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  winnerTeamId: string,
): Match {
  return {
    matchId,
    homeTeamId,
    awayTeamId,
    isTwoLegged: false,
    legs: [
      {
        console: 'PLAY_5',
        homeGoals: winnerTeamId === homeTeamId ? 1 : 0,
        awayGoals: winnerTeamId === awayTeamId ? 1 : 0,
        wentToPenalties: false,
      },
    ],
    status: MatchStatus.PLAYED,
    winnerTeamId,
    isDraw: false,
    allowsPenalties: true,
  } as Match;
}

function scheduledMatch(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
): Match {
  return {
    matchId,
    homeTeamId,
    awayTeamId,
    isTwoLegged: false,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: true,
  };
}

function stage(rounds: Match[][]): SwissStage {
  return {
    winsToQualify: 3,
    lossesToEliminate: 3,
    targetQualifiers: 4,
    participants: [],
    rounds: rounds.map((matches, i) => ({ roundNumber: i + 1, matches })),
    playIn: [],
    qualifiedTeamIds: [],
    knockoutTwoLegged: false,
  };
}

describe('computeSwissDecidedMatchIds', () => {
  it('flags the match where a team reaches the 3rd win as its decisive match', () => {
    // A beats B, C, D in rounds 1-3 -> qualifies in round 3 (R3M).
    const s = stage([
      [playedMatch('R1M', 'A', 'B', 'A')],
      [playedMatch('R2M', 'A', 'C', 'A')],
      [playedMatch('R3M', 'A', 'D', 'A')],
    ]);

    const decided = computeSwissDecidedMatchIds(s);

    expect(decided.get('A')).toBe('R3M');
    // Opponents each have a single loss, none decided yet.
    expect(decided.has('B')).toBe(false);
  });

  it('flags the match where a team reaches the 3rd loss as its decisive match', () => {
    // Z loses three times -> eliminated in round 3.
    const s = stage([
      [playedMatch('R1M', 'A', 'Z', 'A')],
      [playedMatch('R2M', 'B', 'Z', 'B')],
      [playedMatch('R3M', 'C', 'Z', 'C')],
    ]);

    const decided = computeSwissDecidedMatchIds(s);

    expect(decided.get('Z')).toBe('R3M');
  });

  it('does not decide anyone before a threshold is crossed and ignores unplayed matches', () => {
    const s = stage([
      [playedMatch('R1M', 'A', 'B', 'A')],
      [scheduledMatch('R2M', 'A', 'C')],
    ]);

    const decided = computeSwissDecidedMatchIds(s);

    expect(decided.size).toBe(0);
  });
});
