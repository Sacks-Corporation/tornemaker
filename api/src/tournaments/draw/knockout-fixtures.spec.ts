import { buildKnockoutStage } from './knockout-fixtures';
import { makeSeededTeams } from './test-helpers';

describe('buildKnockoutStage', () => {
  it('builds a clean bracket for a power-of-two team count (8) with no preliminary round', () => {
    const teams = makeSeededTeams(8);
    const stage = buildKnockoutStage(teams, false, false);
    const { bracket } = stage;

    expect(bracket.drawSize).toBe(8);
    expect(bracket.hasPreliminaryRound).toBe(false);
    expect(bracket.byeTeamIds).toEqual([]);
    expect(bracket.hasThirdPlaceMatch).toBe(false);
    expect(bracket.thirdPlaceMatch).toBeUndefined();

    // Round of 8 (Cuartos), Semifinales, Final = 3 rounds.
    expect(bracket.rounds).toHaveLength(3);
    expect(bracket.rounds.map((r) => r.name)).toEqual([
      'Cuartos de Final',
      'Semifinales',
      'Final',
    ]);
    expect(bracket.rounds[0].matches).toHaveLength(4);
    expect(bracket.rounds[1].matches).toHaveLength(2);
    expect(bracket.rounds[2].matches).toHaveLength(1);

    // First round has every slot filled; later rounds are placeholders.
    for (const match of bracket.rounds[0].matches) {
      expect(match.homeTeamId).toBeDefined();
      expect(match.awayTeamId).toBeDefined();
    }
    for (const match of [
      ...bracket.rounds[1].matches,
      ...bracket.rounds[2].matches,
    ]) {
      expect(match.homeTeamId).toBeUndefined();
      expect(match.awayTeamId).toBeUndefined();
    }

    // Every match id is unique.
    const allMatchIds = bracket.rounds.flatMap((r) =>
      r.matches.map((m) => m.matchId),
    );
    expect(new Set(allMatchIds).size).toBe(allMatchIds.length);
  });

  it('builds a preliminary round + clean bracket for 6 teams (2 byes, 2 prelim matches)', () => {
    const teams = makeSeededTeams(6);
    const stage = buildKnockoutStage(teams, false, false);
    const { bracket } = stage;

    expect(bracket.drawSize).toBe(8);
    expect(bracket.hasPreliminaryRound).toBe(true);
    expect(bracket.byeTeamIds).toHaveLength(2);
    // Best two seeds get the byes.
    expect(bracket.byeTeamIds).toEqual([teams[0].hexId, teams[1].hexId]);

    // Preliminary round, Semifinales, Final = 3 rounds.
    expect(bracket.rounds).toHaveLength(3);
    expect(bracket.rounds.map((r) => r.name)).toEqual([
      'Ronda Preliminar',
      'Semifinales',
      'Final',
    ]);

    const prelimRound = bracket.rounds[0];
    expect(prelimRound.matches).toHaveLength(2);
    for (const match of prelimRound.matches) {
      expect(match.homeTeamId).toBeDefined();
      expect(match.awayTeamId).toBeDefined();
    }

    const semiRound = bracket.rounds[1];
    expect(semiRound.matches).toHaveLength(2);
    // Every bye team is directly placed into the semifinal round.
    const semiTeamIds = semiRound.matches.flatMap((m) =>
      [m.homeTeamId, m.awayTeamId].filter((id): id is string => Boolean(id)),
    );
    expect(semiTeamIds).toEqual(expect.arrayContaining(bracket.byeTeamIds));

    expect(bracket.rounds[2].matches).toHaveLength(1);
  });

  it('builds a preliminary round + clean bracket for 20 teams (12 byes, 4 prelim matches)', () => {
    const teams = makeSeededTeams(20);
    const stage = buildKnockoutStage(teams, false, false);
    const { bracket } = stage;

    expect(bracket.drawSize).toBe(32);
    expect(bracket.hasPreliminaryRound).toBe(true);
    expect(bracket.byeTeamIds).toHaveLength(12);

    const prelimRound = bracket.rounds[0];
    expect(prelimRound.name).toBe('Ronda Preliminar');
    expect(prelimRound.matches).toHaveLength(4);

    // Octavos (16 teams / 8 matches), Cuartos (4), Semis (2), Final (1).
    expect(bracket.rounds.map((r) => r.name)).toEqual([
      'Ronda Preliminar',
      'Octavos de Final',
      'Cuartos de Final',
      'Semifinales',
      'Final',
    ]);
    expect(bracket.rounds[1].matches).toHaveLength(8);
    expect(bracket.rounds[2].matches).toHaveLength(4);
    expect(bracket.rounds[3].matches).toHaveLength(2);
    expect(bracket.rounds[4].matches).toHaveLength(1);

    // All 12 byes + 4 prelim winners fill exactly the 16 slots (8 matches) of round 1.
    const round1Slots = bracket.rounds[1].matches.flatMap((m) =>
      [m.homeTeamId, m.awayTeamId].filter((id): id is string => Boolean(id)),
    );
    expect(round1Slots).toHaveLength(12);
    expect(new Set(round1Slots).size).toBe(12);
  });

  it('marks the third-place match as single-leg even when the bracket itself is two-legged', () => {
    const teams = makeSeededTeams(8);
    const stage = buildKnockoutStage(teams, true, true);
    const { bracket } = stage;

    expect(bracket.isTwoLegged).toBe(true);
    expect(bracket.hasThirdPlaceMatch).toBe(true);
    expect(bracket.thirdPlaceMatch).toBeDefined();
    expect(bracket.thirdPlaceMatch?.isTwoLegged).toBe(false);

    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        expect(match.isTwoLegged).toBe(true);
      }
    }
  });
});
