import { Bracket } from '../schemas/common/bracket.schema';
import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import {
  advanceWinnerInBracket,
  isBracketComplete,
} from './bracket-advance.util';

function placeholder(matchId: string, home?: string, away?: string): Match {
  return {
    matchId,
    homeTeamId: home,
    awayTeamId: away,
    isTwoLegged: false,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: true,
  };
}

function fourTeamBracket(hasThirdPlaceMatch = false): Bracket {
  return {
    drawSize: 4,
    byeTeamIds: [],
    hasPreliminaryRound: false,
    isTwoLegged: false,
    hasThirdPlaceMatch,
    thirdPlaceMatch: hasThirdPlaceMatch ? placeholder('3rd') : undefined,
    rounds: [
      {
        roundNumber: 0,
        name: 'Semifinales',
        matches: [placeholder('sf1', 'A', 'B'), placeholder('sf2', 'C', 'D')],
      },
      { roundNumber: 1, name: 'Final', matches: [placeholder('final')] },
    ],
  };
}

describe('advanceWinnerInBracket — standard rounds', () => {
  it('feeds match 0 winner into the final home slot', () => {
    const bracket = fourTeamBracket();
    advanceWinnerInBracket(bracket, 0, 0, 'A', 'B');
    expect(bracket.rounds[1].matches[0].homeTeamId).toBe('A');
  });

  it('feeds match 1 winner into the final away slot', () => {
    const bracket = fourTeamBracket();
    advanceWinnerInBracket(bracket, 0, 1, 'D', 'C');
    expect(bracket.rounds[1].matches[0].awayTeamId).toBe('D');
  });

  it('sends both semifinal losers into the third-place match', () => {
    const bracket = fourTeamBracket(true);
    advanceWinnerInBracket(bracket, 0, 0, 'A', 'B');
    advanceWinnerInBracket(bracket, 0, 1, 'C', 'D');
    expect(bracket.thirdPlaceMatch?.homeTeamId).toBe('B');
    expect(bracket.thirdPlaceMatch?.awayTeamId).toBe('D');
  });

  it('records the champion once the final is fed a winner', () => {
    const bracket = fourTeamBracket();
    advanceWinnerInBracket(bracket, 0, 0, 'A', 'B');
    advanceWinnerInBracket(bracket, 0, 1, 'C', 'D');
    advanceWinnerInBracket(bracket, 1, 0, 'A', 'C');
    expect(bracket.championTeamId).toBe('A');
  });
});

describe('advanceWinnerInBracket — preliminary round feed (byeCount-offset positional rule)', () => {
  it('feeds preliminary winners into the main-round match(es) that come AFTER the bye-filled ones, per the flat byes-then-winners layout', () => {
    // 6-team-style bracket: 2 byes, 2 preliminary matches -> the flat
    // first-main-round layout is [bye1, bye2, W0, W1], paired into
    // match0=[bye1,bye2] (already fully filled) and match1=[W0,W1] (both
    // TBD from the two preliminary matches) — see knockout-fixtures.ts.
    const bracket: Bracket = {
      drawSize: 8,
      byeTeamIds: ['bye1', 'bye2'],
      hasPreliminaryRound: true,
      isTwoLegged: false,
      hasThirdPlaceMatch: false,
      rounds: [
        {
          roundNumber: 0,
          name: 'Ronda Preliminar',
          matches: [
            placeholder('p1', 'p1a', 'p1b'),
            placeholder('p2', 'p2a', 'p2b'),
          ],
        },
        {
          roundNumber: 1,
          name: 'Semifinales',
          matches: [
            placeholder('sf1', 'bye1', 'bye2'),
            placeholder('sf2', undefined, undefined),
          ],
        },
        { roundNumber: 2, name: 'Final', matches: [placeholder('final')] },
      ],
    };

    advanceWinnerInBracket(bracket, 0, 0, 'p1a');
    advanceWinnerInBracket(bracket, 0, 1, 'p2b');

    expect(bracket.rounds[1].matches[0]).toMatchObject({
      homeTeamId: 'bye1',
      awayTeamId: 'bye2',
    });
    expect(bracket.rounds[1].matches[1]).toMatchObject({
      homeTeamId: 'p1a',
      awayTeamId: 'p2b',
    });
  });

  it('handles more preliminary matches than main-round matches (1 bye, 3 preliminary matches -> [bye, W0, W1, W2], main round has only 2 matches)', () => {
    // 7-team-style bracket: 1 bye, 3 preliminary matches -> flat layout is
    // [bye1, W0, W1, W2], paired into match0=[bye1, W0] and match1=[W1, W2].
    const bracket: Bracket = {
      drawSize: 8,
      byeTeamIds: ['bye1'],
      hasPreliminaryRound: true,
      isTwoLegged: false,
      hasThirdPlaceMatch: false,
      rounds: [
        {
          roundNumber: 0,
          name: 'Ronda Preliminar',
          matches: [
            placeholder('p1', 'p1a', 'p1b'),
            placeholder('p2', 'p2a', 'p2b'),
            placeholder('p3', 'p3a', 'p3b'),
          ],
        },
        {
          roundNumber: 1,
          name: 'Semifinales',
          matches: [
            placeholder('sf1', 'bye1', undefined),
            placeholder('sf2', undefined, undefined),
          ],
        },
        { roundNumber: 2, name: 'Final', matches: [placeholder('final')] },
      ],
    };

    advanceWinnerInBracket(bracket, 0, 0, 'p1a');
    advanceWinnerInBracket(bracket, 0, 1, 'p2a');
    advanceWinnerInBracket(bracket, 0, 2, 'p3b');

    expect(bracket.rounds[1].matches[0]).toMatchObject({
      homeTeamId: 'bye1',
      awayTeamId: 'p1a',
    });
    expect(bracket.rounds[1].matches[1]).toMatchObject({
      homeTeamId: 'p2a',
      awayTeamId: 'p3b',
    });
  });
});

describe('isBracketComplete', () => {
  it('is false until the final is played', () => {
    const bracket = fourTeamBracket();
    expect(isBracketComplete(bracket)).toBe(false);
  });

  it('is true once the final is played and there is no third-place match', () => {
    const bracket = fourTeamBracket();
    bracket.rounds[1].matches[0].status = MatchStatus.PLAYED;
    expect(isBracketComplete(bracket)).toBe(true);
  });

  it('requires the third-place match to also be played when it exists', () => {
    const bracket = fourTeamBracket(true);
    bracket.rounds[1].matches[0].status = MatchStatus.PLAYED;
    expect(isBracketComplete(bracket)).toBe(false);

    bracket.thirdPlaceMatch!.status = MatchStatus.PLAYED;
    expect(isBracketComplete(bracket)).toBe(true);
  });
});
