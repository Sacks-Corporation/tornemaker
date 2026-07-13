import { BadRequestException } from '@nestjs/common';
import { GameConsole } from '../schemas/common/console.enum';
import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { recordMatchResult } from './match-result.util';

function baseMatch(overrides: Partial<Match> = {}): Match {
  return {
    matchId: 'm1',
    homeTeamId: 'home',
    awayTeamId: 'away',
    isTwoLegged: false,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: false,
    ...overrides,
  };
}

describe('recordMatchResult — single leg, draws allowed (league/group)', () => {
  it('derives a home win and resolves the match', () => {
    const match = baseMatch();
    const outcome = recordMatchResult(
      match,
      { homeGoals: 2, awayGoals: 1 },
      GameConsole.PLAY_5,
    );

    expect(outcome).toEqual({
      legNumber: 1,
      isResolved: true,
      winnerTeamId: 'home',
      isDraw: false,
    });
    expect(match.status).toBe(MatchStatus.PLAYED);
    expect(match.winnerTeamId).toBe('home');
    expect(match.isDraw).toBe(false);
    expect(match.legs[0]).toMatchObject({
      console: GameConsole.PLAY_5,
      homeGoals: 2,
      awayGoals: 1,
      wentToPenalties: false,
      legWinnerTeamId: 'home',
    });
  });

  it('lets the match stand as a draw with no winner', () => {
    const match = baseMatch();
    recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 1 },
      GameConsole.PLAY_5,
    );

    expect(match.status).toBe(MatchStatus.PLAYED);
    expect(match.isDraw).toBe(true);
    expect(match.winnerTeamId).toBeUndefined();
    expect(match.legs[0].legWinnerTeamId).toBeUndefined();
  });

  it('rejects a penaltyWinnerTeamId when the match/phase admits draws', () => {
    const match = baseMatch();
    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 1, awayGoals: 1, penaltyWinnerTeamId: 'home' },
        GameConsole.PLAY_5,
      ),
    ).toThrow(BadRequestException);
  });

  it('is immutable: a second PATCH on an already-played match throws', () => {
    const match = baseMatch();
    recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 0 },
      GameConsole.PLAY_5,
    );
    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 0, awayGoals: 1 },
        GameConsole.PLAY_5,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects recording a result when a team is not yet known', () => {
    const match = baseMatch({ awayTeamId: undefined });
    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 1, awayGoals: 0 },
        GameConsole.PLAY_5,
      ),
    ).toThrow(BadRequestException);
  });
});

describe('recordMatchResult — single leg, no draws allowed (swiss/knockout/third place)', () => {
  it('requires penaltyWinnerTeamId when scores are level', () => {
    const match = baseMatch({ allowsPenalties: true });
    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 1, awayGoals: 1 },
        GameConsole.PLAY_5,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a penaltyWinnerTeamId that is not one of the two teams', () => {
    const match = baseMatch({ allowsPenalties: true });
    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 1, awayGoals: 1, penaltyWinnerTeamId: 'someone-else' },
        GameConsole.PLAY_5,
      ),
    ).toThrow(BadRequestException);
  });

  it('resolves via penalties when scores are level and a valid winner is given', () => {
    const match = baseMatch({ allowsPenalties: true });
    const outcome = recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 1, penaltyWinnerTeamId: 'away' },
      GameConsole.PLAY_5,
    );

    expect(outcome.winnerTeamId).toBe('away');
    expect(outcome.isDraw).toBe(false);
    expect(match.legs[0].wentToPenalties).toBe(true);
    expect(match.legs[0].legWinnerTeamId).toBe('away');
    expect(match.status).toBe(MatchStatus.PLAYED);
  });

  it('does not require penalties when there is a clear winner', () => {
    const match = baseMatch({ allowsPenalties: true });
    const outcome = recordMatchResult(
      match,
      { homeGoals: 3, awayGoals: 1 },
      GameConsole.PLAY_5,
    );
    expect(outcome.winnerTeamId).toBe('home');
    expect(match.legs[0].wentToPenalties).toBe(false);
  });
});

describe('recordMatchResult — two-legged ties', () => {
  it('leg 1 (ida) never requires penalties even when level, and leaves the tie unresolved', () => {
    const match = baseMatch({ isTwoLegged: true, allowsPenalties: true });
    const outcome = recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 1 },
      GameConsole.PLAY_5,
    );

    expect(outcome).toEqual({
      legNumber: 1,
      isResolved: false,
      winnerTeamId: undefined,
      isDraw: false,
    });
    expect(match.status).toBe(MatchStatus.SCHEDULED);
    expect(match.legs).toHaveLength(1);
    expect(match.legs[0].wentToPenalties).toBe(false);
    expect(match.legs[0].legWinnerTeamId).toBeUndefined();
  });

  it('leg 2 decides by aggregate when not level', () => {
    const match = baseMatch({ isTwoLegged: true, allowsPenalties: true });
    recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 0 },
      GameConsole.PLAY_5,
    ); // ida: home 1-0
    const outcome = recordMatchResult(
      match,
      { homeGoals: 0, awayGoals: 0 },
      GameConsole.PLAY_5,
    ); // vuelta: home 0-0 (agg 1-0)

    expect(outcome.isResolved).toBe(true);
    expect(outcome.winnerTeamId).toBe('home');
    expect(match.status).toBe(MatchStatus.PLAYED);
    expect(match.legs).toHaveLength(2);
  });

  it('leg 2 requires penalties when the aggregate is level', () => {
    const match = baseMatch({ isTwoLegged: true, allowsPenalties: true });
    recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 0 },
      GameConsole.PLAY_5,
    ); // ida: home 1-0

    expect(
      () =>
        recordMatchResult(
          match,
          { homeGoals: 0, awayGoals: 1 },
          GameConsole.PLAY_5,
        ), // agg 1-1
    ).toThrow(BadRequestException);

    const outcome = recordMatchResult(
      match,
      { homeGoals: 0, awayGoals: 1, penaltyWinnerTeamId: 'away' },
      GameConsole.PLAY_5,
    );
    expect(outcome.winnerTeamId).toBe('away');
    expect(match.winnerTeamId).toBe('away');
    expect(match.status).toBe(MatchStatus.PLAYED);
  });

  it('both legs are immutable once recorded', () => {
    const match = baseMatch({ isTwoLegged: true, allowsPenalties: true });
    recordMatchResult(
      match,
      { homeGoals: 1, awayGoals: 0 },
      GameConsole.PLAY_5,
    );
    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 9, awayGoals: 9 },
        GameConsole.PLAY_5,
      ),
    ).not.toThrow(); // leg 2 is still open

    expect(() =>
      recordMatchResult(
        match,
        { homeGoals: 1, awayGoals: 1 },
        GameConsole.PLAY_5,
      ),
    ).toThrow(BadRequestException); // both legs now recorded
  });
});
