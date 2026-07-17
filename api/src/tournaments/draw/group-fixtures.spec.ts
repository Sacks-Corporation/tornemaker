import { buildGroupStage } from './group-fixtures';
import { makeSeededTeams } from './test-helpers';

describe('buildGroupStage', () => {
  it('distributes 12 teams into 3 clean groups of 4 (12/C4)', () => {
    const teams = makeSeededTeams(12);
    const stage = buildGroupStage(teams, 4, false);

    expect(stage.groupCap).toBe(4);
    expect(stage.groups).toHaveLength(3);
    expect(stage.bestThirdPlaceSlots).toBe(0);
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

  it('balances an uneven split (10/C4 -> [4, 3, 3], never [4, 4, 2])', () => {
    const teams = makeSeededTeams(10);
    const stage = buildGroupStage(teams, 4, false);

    expect(stage.groups).toHaveLength(3);
    expect(stage.groups.map((g) => g.teamIds.length)).toEqual([4, 3, 3]);

    const allTeamIds = stage.groups.flatMap((g) => g.teamIds);
    expect(new Set(allTeamIds).size).toBe(10);
  });

  it('balances an uneven split (7/C4 -> [4, 3])', () => {
    const teams = makeSeededTeams(7);
    const stage = buildGroupStage(teams, 4, false);

    expect(stage.groups).toHaveLength(2);
    expect(stage.groups.map((g) => g.teamIds.length)).toEqual([4, 3]);
  });

  it('throws when the teamCount/groupCap combination is not a valid distribution (10/C3)', () => {
    const teams = makeSeededTeams(10);
    expect(() => buildGroupStage(teams, 3, false)).toThrow();
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
