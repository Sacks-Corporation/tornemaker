import { Types } from 'mongoose';
import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { SwissParticipant } from '../schemas/swiss-stage.schema';

/** Swiss matches always admit penalties (they must always produce a winner). */
const SWISS_ALLOWS_PENALTIES = true;

/**
 * Updates the two participants' running record after a Swiss (or play-in)
 * match is resolved. Swiss matches always produce a winner (see
 * `Match.allowsPenalties` doc — draws escalate to penalties), so exactly one
 * of `homeWon`/`awayWon` must be true.
 */
export function applySwissMatchResult(
  home: SwissParticipant,
  away: SwissParticipant,
  homeGoals: number,
  awayGoals: number,
  winnerTeamId: string,
  winsToQualify: number,
  lossesToEliminate: number,
): void {
  const homeWon = winnerTeamId === home.teamId;
  const winner = homeWon ? home : away;
  const loser = homeWon ? away : home;
  const goalDiff = homeGoals - awayGoals;

  winner.wins++;
  loser.losses++;
  winner.gameDifferential += homeWon ? goalDiff : -goalDiff;
  loser.gameDifferential += homeWon ? -goalDiff : goalDiff;

  if (!home.opponentTeamIds.includes(away.teamId)) {
    home.opponentTeamIds.push(away.teamId);
  }
  if (!away.opponentTeamIds.includes(home.teamId)) {
    away.opponentTeamIds.push(home.teamId);
  }

  home.isQualified = home.wins >= winsToQualify;
  home.isEliminated = home.losses >= lossesToEliminate;
  away.isQualified = away.wins >= winsToQualify;
  away.isEliminated = away.losses >= lossesToEliminate;
}

export interface SwissPairingOptions {
  /** Stage thresholds, used to simulate the following round (lookahead). */
  winsToQualify: number;
  lossesToEliminate: number;
  /**
   * Stage `targetQualifiers`. When a simulated outcome already produces at
   * least this many qualifiers there is no following regular round (the
   * stage finishes or goes to play-in), so that outcome carries no risk.
   * Optional: without it every outcome is assumed to need another round.
   */
  targetQualifiers?: number;
  /** Random source in [0, 1). Defaults to `Math.random`; injected in tests. */
  rng?: () => number;
}

/** Cost of one rematch: always worse than any amount of group distance. */
const REMATCH_COST = 1000;
/** Max equally-good pairings collected as candidates for the lookahead. */
const MAX_CANDIDATES = 16;
/** Node cap for the main pairing search (keeps the worst case bounded). */
const SEARCH_NODE_BUDGET = 200_000;
/** Node cap for each lookahead feasibility check. */
const LOOKAHEAD_NODE_BUDGET = 2_000;
/** Up to this many matches every outcome is simulated; above it, sampled. */
const LOOKAHEAD_EXHAUSTIVE_MAX_MATCHES = 8;
const LOOKAHEAD_SAMPLES = 64;

/** Pool ordered best score group first, plus each entry's group index. */
interface OrderedPool {
  teams: SwissParticipant[];
  /** `groupIndex[i]` = index of `teams[i]`'s score group (0 = best record). */
  groupIndex: number[];
}

interface Pairing {
  /** Index pairs into `OrderedPool.teams`. */
  pairs: [number, number][];
  /** Index left without a match when the pool is odd, else `null`. */
  restIndex: number | null;
  cost: number;
}

interface SearchOptions {
  allowRematches: boolean;
  maxSolutions: number;
  nodeBudget: number;
}

interface SearchResult {
  solutions: Pairing[];
  /** True when the search space was fully explored (no budget cut-off). */
  exhaustive: boolean;
}

function shuffleInPlace<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Best record first: most wins, then fewest losses. */
function compareRecords(a: SwissParticipant, b: SwissParticipant): number {
  return b.wins - a.wins || a.losses - b.losses;
}

/**
 * Orders the pool by score group (stable sort, so whatever order the pool
 * came in — shuffled by the caller — is kept inside each group).
 */
function orderPool(pool: SwissParticipant[]): OrderedPool {
  const teams = [...pool].sort(compareRecords);
  const groupIndex: number[] = [];
  let current = -1;
  teams.forEach((team, i) => {
    if (i === 0 || compareRecords(teams[i - 1], team) !== 0) {
      current++;
    }
    groupIndex.push(current);
  });
  return { teams, groupIndex };
}

/**
 * Minimum possible group distance: every boundary between two consecutive
 * score groups with an odd number of teams above it needs at least one
 * cross-group pairing (one team "floating" down).
 */
function groupDistanceLowerBound(groupIndex: number[]): number {
  let bound = 0;
  for (let i = 0; i < groupIndex.length - 1; i++) {
    if (groupIndex[i] !== groupIndex[i + 1] && (i + 1) % 2 === 1) {
      bound++;
    }
  }
  return bound;
}

/**
 * Depth-first branch & bound over the ordered pool. Pairs are only allowed
 * within the same score group or between ADJACENT score groups (distance 1).
 * Cost = REMATCH_COST per rematch + 1 per cross-group pair. When the pool is
 * odd one team is left out, preferring the worst score group (cost = how many
 * groups above the last one it sits).
 *
 * Partners are tried cheapest first and, among equal costs, in pool order —
 * which is shuffled, so the solutions found are a random sample of the best
 * ones. Collects up to `maxSolutions` pairings of the minimum cost found.
 */
function searchPairings(
  pool: OrderedPool,
  options: SearchOptions,
): SearchResult {
  const { teams, groupIndex } = pool;
  const n = teams.length;
  const lastGroup = n > 0 ? groupIndex[n - 1] : 0;
  const lowerBound = groupDistanceLowerBound(groupIndex);

  const met: boolean[][] = teams.map((a) =>
    teams.map(
      (b) =>
        a.opponentTeamIds.includes(b.teamId) ||
        b.opponentTeamIds.includes(a.teamId),
    ),
  );

  const paired = new Array<boolean>(n).fill(false);
  const pairs: [number, number][] = [];
  let restIndex: number | null = null;
  let best = Infinity;
  let solutions: Pairing[] = [];
  let nodes = 0;
  let stopped = false;
  let cutOff = false;

  const visit = (cost: number): void => {
    if (stopped) {
      return;
    }
    if (++nodes > options.nodeBudget) {
      stopped = true;
      cutOff = true;
      return;
    }

    const a = paired.indexOf(false);
    if (a === -1) {
      if (cost < best) {
        best = cost;
        solutions = [];
      }
      if (solutions.length < options.maxSolutions) {
        solutions.push({ pairs: [...pairs], restIndex, cost });
      }
      if (solutions.length >= options.maxSolutions && best <= lowerBound) {
        stopped = true;
      }
      return;
    }

    const moves: { partner: number | null; add: number }[] = [];
    for (let b = a + 1; b < n; b++) {
      if (paired[b]) {
        continue;
      }
      const distance = groupIndex[b] - groupIndex[a];
      if (distance > 1) {
        break; // ordered by group: everything after is even further away
      }
      if (met[a][b] && !options.allowRematches) {
        continue;
      }
      moves.push({
        partner: b,
        add: distance + (met[a][b] ? REMATCH_COST : 0),
      });
    }
    if (n % 2 === 1 && restIndex === null) {
      moves.push({ partner: null, add: lastGroup - groupIndex[a] });
    }
    // Stable: equal-cost moves keep the (shuffled) pool order.
    moves.sort((x, y) => x.add - y.add);

    for (const move of moves) {
      const next = cost + move.add;
      // Once the candidate list is full only strictly better pairings matter.
      const limit = solutions.length >= options.maxSolutions ? best - 1 : best;
      if (next > limit) {
        break; // moves are sorted by cost
      }
      paired[a] = true;
      if (move.partner === null) {
        restIndex = a;
        visit(next);
        restIndex = null;
      } else {
        paired[move.partner] = true;
        pairs.push([a, move.partner]);
        visit(next);
        pairs.pop();
        paired[move.partner] = false;
      }
      paired[a] = false;
      if (stopped) {
        return;
      }
    }
  };

  visit(0);
  return { solutions, exhaustive: !cutOff };
}

function cloneParticipant(p: SwissParticipant): SwissParticipant {
  return { ...p, opponentTeamIds: [...p.opponentTeamIds] };
}

/**
 * Share of the possible outcomes of `pairing` after which the FOLLOWING
 * round cannot be paired without a rematch (0 = always fine, 1 = always
 * forced). Every outcome is simulated for small rounds (where the risk is
 * real: late rounds with few teams per group); bigger rounds are sampled.
 * A feasibility check that hits its node cap counts as feasible.
 */
function lookaheadRisk(
  participants: SwissParticipant[],
  pool: OrderedPool,
  pairing: Pairing,
  options: SwissPairingOptions,
  rng: () => number,
): number {
  const matchCount = pairing.pairs.length;
  if (matchCount === 0) {
    return 0;
  }

  const outcomes: boolean[][] = [];
  if (matchCount <= LOOKAHEAD_EXHAUSTIVE_MAX_MATCHES) {
    for (let mask = 0; mask < 1 << matchCount; mask++) {
      outcomes.push(
        Array.from({ length: matchCount }, (_, i) => ((mask >> i) & 1) === 1),
      );
    }
  } else {
    for (let s = 0; s < LOOKAHEAD_SAMPLES; s++) {
      outcomes.push(Array.from({ length: matchCount }, () => rng() < 0.5));
    }
  }

  let blocked = 0;
  for (const homeWins of outcomes) {
    const clones = new Map(
      participants.map((p) => [p.teamId, cloneParticipant(p)]),
    );
    pairing.pairs.forEach(([i, j], k) => {
      const home = clones.get(pool.teams[i].teamId) as SwissParticipant;
      const away = clones.get(pool.teams[j].teamId) as SwissParticipant;
      applySwissMatchResult(
        home,
        away,
        homeWins[k] ? 1 : 0,
        homeWins[k] ? 0 : 1,
        homeWins[k] ? home.teamId : away.teamId,
        options.winsToQualify,
        options.lossesToEliminate,
      );
    });

    const all = [...clones.values()];
    if (
      options.targetQualifiers !== undefined &&
      all.filter((p) => p.isQualified).length >= options.targetQualifiers
    ) {
      continue; // no further regular round after this outcome
    }
    const nextPool = all.filter((p) => !p.isQualified && !p.isEliminated);
    if (nextPool.length < 2) {
      continue;
    }
    const result = searchPairings(orderPool(nextPool), {
      allowRematches: false,
      maxSolutions: 1,
      nodeBudget: LOOKAHEAD_NODE_BUDGET,
    });
    if (result.solutions.length === 0 && result.exhaustive) {
      blocked++;
    }
  }
  return blocked / outcomes.length;
}

/**
 * Pairs every participant that is still alive (not eliminated) and not yet
 * qualified for the next Swiss round. Rules, in priority order:
 *
 *   1. Score groups are respected: teams play others with the same record
 *      (2-0 vs 2-0, 1-1 vs 1-1, ...). A team only crosses to the ADJACENT
 *      score group when its group is odd (exactly one team floats down) or
 *      when no arrangement of the group avoids a rematch.
 *   2. No rematches (`opponentTeamIds`) whenever any valid pairing avoids
 *      them; only the unavoidable minimum is ever accepted.
 *   3. Lookahead: among the pairings that are equally good on 1 and 2, pick
 *      the one least likely to force a rematch in the FOLLOWING round,
 *      simulating its possible results.
 *   4. Everything else is random: the pool is reshuffled every round (it is
 *      never tied to the initial draw order), as are the home/away sides.
 *
 * The returned matches are ordered by score group, best record first (all
 * 2-0 matches, then 1-1, then 0-2, ...; a cross-group match sits between
 * its two groups), random within each group — the web board renders them in
 * this order.
 *
 * When the pool is odd one team (from the worst score group) is left out of
 * the round, as before — see swiss-stage.schema.ts.
 *
 * Returns `null` when there is nobody left to pair (round is effectively
 * over / everyone is qualified or eliminated).
 */
export function pairNextSwissRound(
  participants: SwissParticipant[],
  options: SwissPairingOptions,
): Match[] | null {
  const rng = options.rng ?? Math.random;
  const alive = participants.filter((p) => !p.isQualified && !p.isEliminated);
  if (alive.length === 0) {
    return null;
  }

  const pool = orderPool(shuffleInPlace([...alive], rng));
  const { solutions } = searchPairings(pool, {
    allowRematches: true,
    maxSolutions: MAX_CANDIDATES,
    nodeBudget: SEARCH_NODE_BUDGET,
  });
  if (solutions.length === 0) {
    return [];
  }

  // Candidates in random order: the first risk-free one is a uniform pick
  // among the risk-free ones, so the scan can stop there.
  const candidates = shuffleInPlace([...solutions], rng);
  let pairing = candidates[0];
  if (candidates.length > 1) {
    let minRisk = Infinity;
    for (const candidate of candidates) {
      const risk = lookaheadRisk(participants, pool, candidate, options, rng);
      if (risk < minRisk) {
        minRisk = risk;
        pairing = candidate;
      }
      if (risk === 0) {
        break;
      }
    }
  }

  // Match order: best score group first (2-0, then 1-1, then 0-2, ...); a
  // cross-group match sits between its two groups. Random within a group.
  const groupOf = (pair: [number, number]): [number, number] => {
    const [gi, gj] = [pool.groupIndex[pair[0]], pool.groupIndex[pair[1]]];
    return [Math.min(gi, gj), Math.max(gi, gj)];
  };
  const orderedPairs = shuffleInPlace([...pairing.pairs], rng).sort((x, y) => {
    const [xBest, xWorst] = groupOf(x);
    const [yBest, yWorst] = groupOf(y);
    return xBest - yBest || xWorst - yWorst;
  });

  return orderedPairs.map(([i, j]) => {
    const [home, away] =
      rng() < 0.5
        ? [pool.teams[i], pool.teams[j]]
        : [pool.teams[j], pool.teams[i]];
    return {
      matchId: new Types.ObjectId().toString(),
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      isTwoLegged: false,
      legs: [],
      status: MatchStatus.SCHEDULED,
      isDraw: false,
      allowsPenalties: SWISS_ALLOWS_PENALTIES,
    };
  });
}

/**
 * Builds the play-in match(es) needed when the number of teams that reached
 * `winsToQualify` doesn't match `targetQualifiers` (see swiss-stage.schema.ts).
 * `rankedQualifiedTeamIds` must already be ordered best-to-worst (by
 * game differential or whatever tiebreak the caller applied). When there
 * are MORE qualifiers than the target, the lowest-ranked excess teams play
 * play-in match(es) to trim the field; when there are FEWER, this shouldn't
 * be called (the caller should just wait for more regular rounds).
 */
export function buildPlayInMatches(
  rankedQualifiedTeamIds: string[],
  targetQualifiers: number,
): Match[] {
  const excess = rankedQualifiedTeamIds.length - targetQualifiers;
  if (excess <= 0) {
    return [];
  }
  // The lowest-ranked (targetQualifiers - 1 + 2*excess) teams contend for the
  // remaining spot(s): pair worst-ranked against next-worst, etc.
  const contenders = rankedQualifiedTeamIds.slice(
    rankedQualifiedTeamIds.length - excess * 2,
  );
  const matches: Match[] = [];
  for (let i = 0; i < contenders.length; i += 2) {
    matches.push({
      matchId: new Types.ObjectId().toString(),
      homeTeamId: contenders[i],
      awayTeamId: contenders[i + 1],
      isTwoLegged: false,
      legs: [],
      status: MatchStatus.SCHEDULED,
      isDraw: false,
      allowsPenalties: SWISS_ALLOWS_PENALTIES,
    });
  }
  return matches;
}
