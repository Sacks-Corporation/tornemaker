import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import {
  collectAllMatches,
  ConsoleAssigner,
  ensureAssignedConsole,
} from './console-assignment.util';

function scheduledMatch(id: string, assignedConsole?: string): Match {
  return {
    matchId: id,
    homeTeamId: 'a',
    awayTeamId: 'b',
    isTwoLegged: false,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: false,
    assignedConsole,
  };
}

describe('ConsoleAssigner', () => {
  it('round-robins over the given console units starting from the given offset', () => {
    const units = ['PLAY_5', 'PLAY_5', 'PLAY_4'];
    const assigner = new ConsoleAssigner(units, 0);
    expect(assigner.next()).toBe('PLAY_5');
    expect(assigner.next()).toBe('PLAY_5');
    expect(assigner.next()).toBe('PLAY_4');
    expect(assigner.next()).toBe('PLAY_5'); // wraps around
  });

  it('continues the rotation from a non-zero starting count (idempotent across calls)', () => {
    const units = ['PLAY_5', 'PLAY_4'];
    const assigner = new ConsoleAssigner(units, 3); // 3 % 2 = 1
    expect(assigner.next()).toBe('PLAY_4');
    expect(assigner.next()).toBe('PLAY_5');
  });

  it('throws for an empty console list', () => {
    expect(() => new ConsoleAssigner([], 0)).toThrow();
  });
});

describe('ensureAssignedConsole', () => {
  it('assigns a console when missing', () => {
    const match = scheduledMatch('m1');
    const assigner = new ConsoleAssigner(['PLAY_5'], 0);
    const result = ensureAssignedConsole(match, assigner);
    expect(result).toBe('PLAY_5');
    expect(match.assignedConsole).toBe('PLAY_5');
  });

  it('does not overwrite an already-assigned console', () => {
    const match = scheduledMatch('m1', 'PLAY_3');
    const assigner = new ConsoleAssigner(['PLAY_5'], 0);
    const result = ensureAssignedConsole(match, assigner);
    expect(result).toBe('PLAY_3');
    expect(match.assignedConsole).toBe('PLAY_3');
  });
});

describe('collectAllMatches', () => {
  it('walks every phase (league, group, swiss, knockout, standalone third place)', () => {
    const container = {
      leagueStage: {
        doubleRound: false,
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
        matchdays: [{ roundNumber: 1, matches: [scheduledMatch('l1')] }],
        standings: [],
        tiebreakMatches: [scheduledMatch('l-tb')],
      },
      groupStage: {
        groupSize: 4,
        doubleRound: false,
        groups: [
          {
            name: 'Grupo A',
            teamIds: ['a', 'b'],
            matches: [scheduledMatch('g1')],
            standings: [],
            tiebreakMatches: [scheduledMatch('g-tb')],
          },
        ],
        bestThirdPlaceSlots: 0,
        qualifiedThirdPlaceTeamIds: [],
      },
      swissStage: {
        winsToQualify: 3,
        lossesToEliminate: 3,
        targetQualifiers: 4,
        participants: [],
        rounds: [{ roundNumber: 1, matches: [scheduledMatch('s1')] }],
        playIn: [scheduledMatch('s-pi')],
        qualifiedTeamIds: [],
      },
      knockoutStage: {
        bracket: {
          drawSize: 2,
          byeTeamIds: [],
          hasPreliminaryRound: false,
          rounds: [
            { roundNumber: 0, name: 'Final', matches: [scheduledMatch('k1')] },
          ],
          isTwoLegged: false,
          hasThirdPlaceMatch: true,
          thirdPlaceMatch: scheduledMatch('k-3rd'),
        },
      },
      thirdPlaceMatch: scheduledMatch('root-3rd'),
    };

    const all = collectAllMatches(container);
    expect(all.map((m) => m.matchId).sort()).toEqual(
      [
        'g-tb',
        'g1',
        'k-3rd',
        'k1',
        'l-tb',
        'l1',
        'root-3rd',
        's-pi',
        's1',
      ].sort(),
    );
  });
});
