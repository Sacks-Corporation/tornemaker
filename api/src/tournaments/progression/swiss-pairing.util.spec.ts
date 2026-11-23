import { buildSwissStage } from '../draw/swiss-fixtures';
import { makeSeededTeams } from '../draw/test-helpers';
import { SWISS_TEAM_COUNTS } from '../dto/format-rules';
import { Match } from '../schemas/common/match.schema';
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

/** Deterministic PRNG (mulberry32) so randomized tests are reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const THRESHOLDS = { winsToQualify: 3, lossesToEliminate: 3 };

function pairKeys(matches: Match[]): string[] {
  return matches.map((m) => [m.homeTeamId, m.awayTeamId].sort().join('-'));
}

/** Lookup by teamId that fails loudly (match team ids are optional on the type). */
function indexById(
  participants: SwissParticipant[],
): (teamId: string | undefined) => SwissParticipant {
  const byId = new Map(participants.map((p) => [p.teamId, p]));
  return (teamId) => {
    const found = teamId === undefined ? undefined : byId.get(teamId);
    if (!found) {
      throw new Error(`Unknown teamId ${teamId}`);
    }
    return found;
  };
}

function countRematches(
  matches: Match[],
  participants: SwissParticipant[],
): number {
  const byId = indexById(participants);
  return matches.filter((m) =>
    byId(m.homeTeamId).opponentTeamIds.includes(byId(m.awayTeamId).teamId),
  ).length;
}

function compareRecords(a: SwissParticipant, b: SwissParticipant): number {
  return b.wins - a.wins || a.losses - b.losses;
}

/**
 * Brute-force oracle: does a rematch-free pairing exist that respects the
 * score-group rule (same group or adjacent group only; one team may sit out
 * when the pool is odd)? Only used on small pools.
 */
function rematchFreePairingExists(pool: SwissParticipant[]): boolean {
  const teams = [...pool].sort(compareRecords);
  const group: number[] = [];
  teams.forEach((t, i) =>
    group.push(
      i === 0
        ? 0
        : group[i - 1] + (compareRecords(teams[i - 1], t) !== 0 ? 1 : 0),
    ),
  );
  const used = new Array<boolean>(teams.length).fill(false);
  const solve = (restUsed: boolean): boolean => {
    const a = used.indexOf(false);
    if (a === -1) return true;
    used[a] = true;
    for (let b = a + 1; b < teams.length; b++) {
      if (used[b] || group[b] - group[a] > 1) continue;
      if (teams[a].opponentTeamIds.includes(teams[b].teamId)) continue;
      used[b] = true;
      if (solve(restUsed)) return true;
      used[b] = false;
    }
    if (teams.length % 2 === 1 && !restUsed && solve(true)) return true;
    used[a] = false;
    return false;
  };
  return solve(false);
}

describe('pairNextSwissRound', () => {
  it('pairs everyone within the same score group', () => {
    const participants = [
      participant('A', { wins: 1 }),
      participant('B', { wins: 1 }),
      participant('C', { wins: 0, losses: 1 }),
      participant('D', { wins: 0, losses: 1 }),
    ];
    const matches = pairNextSwissRound(participants, THRESHOLDS);
    expect(matches).toHaveLength(2);
    const pairs = pairKeys(matches!);
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
    const matches = pairNextSwissRound(participants, THRESHOLDS);
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
    const matches = pairNextSwissRound(participants, THRESHOLDS);
    const pairs = pairKeys(matches!);
    expect(pairs).not.toContain(['A', 'B'].sort().join('-'));
    expect(pairs).not.toContain(['C', 'D'].sort().join('-'));
  });

  it('finds the rematch-free arrangement the old greedy pairing missed', () => {
    // Greedy "first available" paired A-B and was then forced into C-D.
    for (let seed = 1; seed <= 30; seed++) {
      const participants = [
        participant('A', { wins: 1 }),
        participant('B', { wins: 1 }),
        participant('C', { wins: 1, opponentTeamIds: ['D'] }),
        participant('D', { wins: 1, opponentTeamIds: ['C'] }),
      ];
      const matches = pairNextSwissRound(participants, {
        ...THRESHOLDS,
        rng: seededRng(seed),
      })!;
      expect(matches).toHaveLength(2);
      expect(countRematches(matches, participants)).toBe(0);
    }
  });

  it('floats exactly one team from an odd score group, without a rematch', () => {
    // 2-1 group of 3 (A-B already met) and 1-2 group of 3. The only valid
    // floater (B or A) has already played D and E, so it must face F.
    for (let seed = 1; seed <= 30; seed++) {
      const participants = [
        participant('A', {
          wins: 2,
          losses: 1,
          opponentTeamIds: ['B', 'D', 'E'],
        }),
        participant('B', {
          wins: 2,
          losses: 1,
          opponentTeamIds: ['A', 'D', 'E'],
        }),
        participant('C', { wins: 2, losses: 1 }),
        participant('D', { wins: 1, losses: 2, opponentTeamIds: ['A', 'B'] }),
        participant('E', { wins: 1, losses: 2, opponentTeamIds: ['A', 'B'] }),
        participant('F', { wins: 1, losses: 2 }),
      ];
      const matches = pairNextSwissRound(participants, {
        ...THRESHOLDS,
        rng: seededRng(seed),
      })!;
      expect(matches).toHaveLength(3);
      expect(countRematches(matches, participants)).toBe(0);
      const byId = indexById(participants);
      const crossGroup = matches.filter(
        (m) => byId(m.homeTeamId).wins !== byId(m.awayTeamId).wins,
      );
      expect(crossGroup).toHaveLength(1);
    }
  });

  it('never pairs teams more than one score group apart', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const participants = [
        participant('A', { wins: 2 }),
        participant('B', { wins: 1, losses: 1 }),
        participant('C', { wins: 1, losses: 1 }),
        participant('D', { losses: 2 }),
      ];
      const matches = pairNextSwissRound(participants, {
        ...THRESHOLDS,
        rng: seededRng(seed),
      })!;
      const byId = indexById(participants);
      for (const m of matches) {
        const gap = Math.abs(byId(m.homeTeamId).wins - byId(m.awayTeamId).wins);
        expect(gap).toBeLessThanOrEqual(1);
      }
    }
  });

  it('redraws every round instead of following the initial draw order', () => {
    // Round 2 of an 8-team Swiss: the old code always paired W1-W2, W3-W4,
    // L1-L2, L3-L4 (the participants' stored order).
    const participants = [
      participant('W1', { wins: 1, opponentTeamIds: ['L1'] }),
      participant('W2', { wins: 1, opponentTeamIds: ['L2'] }),
      participant('W3', { wins: 1, opponentTeamIds: ['L3'] }),
      participant('W4', { wins: 1, opponentTeamIds: ['L4'] }),
      participant('L1', { losses: 1, opponentTeamIds: ['W1'] }),
      participant('L2', { losses: 1, opponentTeamIds: ['W2'] }),
      participant('L3', { losses: 1, opponentTeamIds: ['W3'] }),
      participant('L4', { losses: 1, opponentTeamIds: ['W4'] }),
    ];
    const drawOrder = ['W1-W2', 'W3-W4', 'L1-L2', 'L3-L4'].sort().join('|');
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const matches = pairNextSwissRound(participants, {
        ...THRESHOLDS,
        rng: seededRng(seed),
      })!;
      seen.add(pairKeys(matches).sort().join('|'));
    }
    expect(seen.size).toBeGreaterThan(1);
    expect([...seen].some((s) => s !== drawOrder)).toBe(true);
  });

  it('prefers the pairing that does not force a rematch next round', () => {
    // Thresholds 2/2: after this round only the four 1-1 teams keep playing
    // (losers of A-B and C-D vs winners of the bottom matches). A..D have
    // all already met E and F, so pairing E-F (and G-H) would ALWAYS leave
    // the next round with no rematch-free option; E-G/F-H or E-H/F-G only
    // sometimes. The top group is forced to A-B / C-D (the rest are rematches).
    const top = ['A', 'B', 'C', 'D'];
    const crossTop: Record<string, string[]> = {
      A: ['C', 'D'],
      B: ['C', 'D'],
      C: ['A', 'B'],
      D: ['A', 'B'],
    };
    for (let seed = 1; seed <= 20; seed++) {
      const participants = [
        ...top.map((id) =>
          participant(id, {
            wins: 1,
            opponentTeamIds: [...crossTop[id], 'E', 'F'],
          }),
        ),
        participant('E', { losses: 1, opponentTeamIds: top }),
        participant('F', { losses: 1, opponentTeamIds: top }),
        participant('G', { losses: 1 }),
        participant('H', { losses: 1 }),
      ];
      const matches = pairNextSwissRound(participants, {
        winsToQualify: 2,
        lossesToEliminate: 2,
        rng: seededRng(seed),
      })!;
      const pairs = pairKeys(matches);
      expect(pairs).toEqual(expect.arrayContaining(['A-B', 'C-D']));
      expect(pairs).not.toContain('E-F');
    }
  });

  it('orders the matches by score group, best record first', () => {
    // 2-0 x3, 1-1 x2, 0-2 x3: one 2-0 floats to 1-1 and one 1-1 to 0-2, so
    // the cross-group matches must sit between their two groups.
    for (let seed = 1; seed <= 30; seed++) {
      const participants = [
        ...['A', 'B', 'C'].map((id) => participant(id, { wins: 2 })),
        ...['D', 'E'].map((id) => participant(id, { wins: 1, losses: 1 })),
        ...['F', 'G', 'H'].map((id) => participant(id, { losses: 2 })),
      ];
      const matches = pairNextSwissRound(participants, {
        ...THRESHOLDS,
        rng: seededRng(seed),
      })!;
      const byId = indexById(participants);
      const order = matches.map((m) => {
        const wins = [byId(m.homeTeamId).wins, byId(m.awayTeamId).wins];
        return [Math.max(...wins), Math.min(...wins)];
      });
      const sorted = [...order].sort((x, y) => y[0] - x[0] || y[1] - x[1]);
      expect(order).toEqual(sorted);
    }
  });

  it('returns null when nobody is left to pair', () => {
    const participants = [
      participant('A', { isQualified: true }),
      participant('B', { isEliminated: true }),
    ];
    expect(pairNextSwissRound(participants, THRESHOLDS)).toBeNull();
  });

  it('every generated match allows penalties (Swiss never allows a draw to stand)', () => {
    const participants = [participant('A'), participant('B')];
    const matches = pairNextSwissRound(participants, THRESHOLDS);
    expect(matches![0].allowsPenalties).toBe(true);
  });

  it('does not mutate the participants it is given', () => {
    const participants = [
      participant('A', { wins: 1 }),
      participant('B', { wins: 1 }),
    ];
    const snapshot = JSON.stringify(participants);
    pairNextSwissRound(participants, { ...THRESHOLDS, rng: seededRng(7) });
    expect(JSON.stringify(participants)).toBe(snapshot);
  });

  describe('full Swiss simulation', () => {
    const TOURNAMENTS_PER_SIZE = 60;

    it.each(SWISS_TEAM_COUNTS.map((n) => [n]))(
      '%i teams: no avoidable rematches, everyone plays, stage ends',
      (teamCount) => {
        const rng = seededRng(1000 + teamCount);
        for (let t = 0; t < TOURNAMENTS_PER_SIZE; t++) {
          const stage = buildSwissStage(makeSeededTeams(teamCount), false);
          const byId = indexById(stage.participants);
          let round = stage.rounds[0].matches;
          let roundsPlayed = 0;

          for (;;) {
            roundsPlayed++;
            expect(roundsPlayed).toBeLessThanOrEqual(12);
            for (const m of round) {
              const homeWins = rng() < 0.5;
              const home = byId(m.homeTeamId);
              const away = byId(m.awayTeamId);
              applySwissMatchResult(
                home,
                away,
                homeWins ? 1 : 0,
                homeWins ? 0 : 1,
                homeWins ? home.teamId : away.teamId,
                stage.winsToQualify,
                stage.lossesToEliminate,
              );
            }
            const qualified = stage.participants.filter((p) => p.isQualified);
            if (qualified.length >= stage.targetQualifiers) {
              break;
            }

            const pool = stage.participants.filter(
              (p) => !p.isQualified && !p.isEliminated,
            );
            const next = pairNextSwissRound(stage.participants, {
              winsToQualify: stage.winsToQualify,
              lossesToEliminate: stage.lossesToEliminate,
              targetQualifiers: stage.targetQualifiers,
              rng,
            });
            expect(next).not.toBeNull();

            // Everyone in the pool plays exactly once (one sits out if odd).
            const playing = next!.flatMap((m) => [m.homeTeamId, m.awayTeamId]);
            expect(new Set(playing).size).toBe(playing.length);
            expect(playing.length).toBe(pool.length - (pool.length % 2));

            // A rematch only when no rematch-free valid pairing existed.
            if (
              pool.length <= 12 &&
              countRematches(next!, stage.participants) > 0
            ) {
              expect(rematchFreePairingExists(pool)).toBe(false);
            }
            if (pool.length > 12) {
              expect(countRematches(next!, stage.participants)).toBe(0);
            }
            round = next!;
          }
        }
      },
    );
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
