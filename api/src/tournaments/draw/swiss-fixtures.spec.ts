import { buildSwissStage } from './swiss-fixtures';
import { makeSeededTeams } from './test-helpers';

describe('buildSwissStage', () => {
  it('initializes all participants at 0-0 and pairs everyone in round 1', () => {
    const teams = makeSeededTeams(8);
    const stage = buildSwissStage(teams);

    expect(stage.winsToQualify).toBe(3);
    expect(stage.lossesToEliminate).toBe(3);
    expect(stage.participants).toHaveLength(8);
    for (const participant of stage.participants) {
      expect(participant.wins).toBe(0);
      expect(participant.losses).toBe(0);
      expect(participant.isQualified).toBe(false);
      expect(participant.isEliminated).toBe(false);
    }

    expect(stage.rounds).toHaveLength(1);
    const round1 = stage.rounds[0];
    expect(round1.roundNumber).toBe(1);
    expect(round1.matches).toHaveLength(4);

    const pairedTeamIds = round1.matches.flatMap((m) => [
      m.homeTeamId,
      m.awayTeamId,
    ]);
    expect(new Set(pairedTeamIds).size).toBe(8);
    for (const match of round1.matches) {
      expect(match.isTwoLegged).toBe(false);
    }

    expect(stage.playIn).toEqual([]);
    expect(stage.qualifiedTeamIds).toEqual([]);
  });

  it.each([
    [8, 4],
    [10, 4],
    [12, 4],
    [16, 8],
    [24, 8],
    [32, 16],
  ])(
    'derives targetQualifiers for teamCount=%i -> %i',
    (teamCount, expectedTargetQualifiers) => {
      const stage = buildSwissStage(makeSeededTeams(teamCount));
      expect(stage.targetQualifiers).toBe(expectedTargetQualifiers);
    },
  );
});
