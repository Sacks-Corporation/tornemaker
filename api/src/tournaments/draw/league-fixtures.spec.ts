import { buildLeagueStage } from './league-fixtures';
import { makeSeededTeams } from './test-helpers';

describe('buildLeagueStage', () => {
  it('builds a single round-robin: every team plays every other team exactly once', () => {
    const teams = makeSeededTeams(6);
    const stage = buildLeagueStage(teams, false);

    expect(stage.doubleRound).toBe(false);
    expect(stage.matchdays).toHaveLength(teams.length - 1);

    const allMatches = stage.matchdays.flatMap((md) => md.matches);
    expect(allMatches).toHaveLength((teams.length * (teams.length - 1)) / 2);

    const pairsSeen = new Set<string>();
    for (const match of allMatches) {
      const key = [match.homeTeamId, match.awayTeamId].sort().join('-');
      expect(pairsSeen.has(key)).toBe(false);
      pairsSeen.add(key);
    }

    // Every team appears in exactly (teamCount - 1) matches.
    const appearances = new Map<string, number>();
    for (const match of allMatches) {
      for (const id of [match.homeTeamId, match.awayTeamId]) {
        appearances.set(id as string, (appearances.get(id as string) ?? 0) + 1);
      }
    }
    for (const team of teams) {
      expect(appearances.get(team.hexId)).toBe(teams.length - 1);
    }

    // One zeroed standing per team.
    expect(stage.standings).toHaveLength(teams.length);
    for (const standing of stage.standings) {
      expect(standing.played).toBe(0);
      expect(standing.points).toBe(0);
    }
  });

  it('builds a double round-robin as separate single-leg fixtures with inverted localía', () => {
    const teams = makeSeededTeams(5); // odd count exercises the bye handling too
    const stage = buildLeagueStage(teams, true);

    expect(stage.doubleRound).toBe(true);
    expect(stage.matchdays).toHaveLength(2 * teams.length);

    const allMatches = stage.matchdays.flatMap((md) => md.matches);
    expect(allMatches).toHaveLength(teams.length * (teams.length - 1));

    for (const match of allMatches) {
      expect(match.isTwoLegged).toBe(false);
      expect(match.legs).toHaveLength(0);
    }

    // Every ordered pair (home, away) appears exactly once.
    const orderedPairsSeen = new Set<string>();
    for (const match of allMatches) {
      const key = `${match.homeTeamId}->${match.awayTeamId}`;
      expect(orderedPairsSeen.has(key)).toBe(false);
      orderedPairsSeen.add(key);
    }

    // And for every unordered pair, both home/away directions exist (mirrored).
    const unorderedPairs = new Set<string>();
    for (const match of allMatches) {
      unorderedPairs.add([match.homeTeamId, match.awayTeamId].sort().join('-'));
    }
    for (const key of unorderedPairs) {
      const [a, b] = key.split('-');
      expect(orderedPairsSeen.has(`${a}->${b}`)).toBe(true);
      expect(orderedPairsSeen.has(`${b}->${a}`)).toBe(true);
    }

    // matchIds are unique within the tournament.
    const matchIds = new Set(allMatches.map((m) => m.matchId));
    expect(matchIds.size).toBe(allMatches.length);
  });
});
