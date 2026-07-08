import { buildGroupStage } from './group-fixtures';
import { makeSeededTeams } from './test-helpers';

describe('buildGroupStage', () => {
  it('distributes 12 teams into 3 groups of 4 with 2 best-third slots', () => {
    const teams = makeSeededTeams(12);
    const stage = buildGroupStage(teams, 4, false);

    expect(stage.groupSize).toBe(4);
    expect(stage.groups).toHaveLength(3);
    expect(stage.bestThirdPlaceSlots).toBe(2);
    expect(stage.qualifiedThirdPlaceTeamIds).toEqual([]);

    expect(stage.groups.map((g) => g.name)).toEqual([
      'Grupo A',
      'Grupo B',
      'Grupo C',
    ]);

    // Every team is placed in exactly one group.
    const allTeamIds = stage.groups.flatMap((g) => g.teamIds);
    expect(new Set(allTeamIds).size).toBe(12);
    expect(allTeamIds).toHaveLength(12);

    for (const group of stage.groups) {
      expect(group.teamIds).toHaveLength(4);
      // Round-robin within a group of 4: 6 matches, one zeroed standing per team.
      expect(group.matches).toHaveLength(6);
      expect(group.standings).toHaveLength(4);
      for (const match of group.matches) {
        expect(group.teamIds).toContain(match.homeTeamId);
        expect(group.teamIds).toContain(match.awayTeamId);
      }
    }
  });

  it('does not need best-third slots when direct qualifiers already form a power of two (8/4)', () => {
    const teams = makeSeededTeams(8);
    const stage = buildGroupStage(teams, 4, false);

    expect(stage.groups).toHaveLength(2);
    expect(stage.bestThirdPlaceSlots).toBe(0);
  });

  it('doubles the fixtures (separate single-leg matches) when twoLegged is requested', () => {
    const teams = makeSeededTeams(8);
    const stage = buildGroupStage(teams, 4, true);

    expect(stage.doubleRound).toBe(true);
    for (const group of stage.groups) {
      // Single round-robin of 4 teams = 6 matches; doubled = 12.
      expect(group.matches).toHaveLength(12);
      const matchIds = new Set(group.matches.map((m) => m.matchId));
      expect(matchIds.size).toBe(12);
    }
  });
});
