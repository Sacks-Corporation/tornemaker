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

function scoreGroupKey(p: SwissParticipant): string {
  return `${p.wins}-${p.losses}`;
}

function haveMet(a: SwissParticipant, b: SwissParticipant): boolean {
  return a.opponentTeamIds.includes(b.teamId);
}

/**
 * Pairs every participant that is still alive (not eliminated) and not yet
 * qualified for the next Swiss round, grouped by score group (their current
 * win/loss record), avoiding rematches whenever possible. Odd-sized score
 * groups "bump" their lowest-ranked leftover participant down into the next
 * (worse) score group, per standard Swiss practice — see swiss-stage.schema.ts.
 *
 * Returns `null` when there is nobody left to pair (round is effectively
 * over / everyone is qualified or eliminated).
 */
export function pairNextSwissRound(
  participants: SwissParticipant[],
): Match[] | null {
  const pool = participants.filter((p) => !p.isQualified && !p.isEliminated);
  if (pool.length === 0) {
    return null;
  }

  // Group by score group, best record first (fewest losses / most wins).
  const groups = new Map<string, SwissParticipant[]>();
  for (const p of pool) {
    const key = scoreGroupKey(p);
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }
  const orderedKeys = [...groups.keys()].sort((a, b) => {
    const [aw, al] = a.split('-').map(Number);
    const [bw, bl] = b.split('-').map(Number);
    if (aw !== bw) return bw - aw;
    return al - bl;
  });

  const pairs: [SwissParticipant, SwissParticipant][] = [];
  let leftover: SwissParticipant[] = [];

  for (const key of orderedKeys) {
    const candidates = [
      ...leftover,
      ...(groups.get(key) as SwissParticipant[]),
    ];
    leftover = [];
    const unpaired = [...candidates];

    while (unpaired.length > 1) {
      const a = unpaired.shift() as SwissParticipant;
      let idx = unpaired.findIndex((b) => !haveMet(a, b));
      if (idx === -1) {
        // No rematch-free opponent available in this pool: forced to repeat.
        idx = 0;
      }
      const b = unpaired.splice(idx, 1)[0];
      pairs.push([a, b]);
    }

    if (unpaired.length === 1) {
      leftover = unpaired;
    }
  }

  // Should not happen for the supported Swiss team counts (always even),
  // but guard defensively: force-pair the last odd one out with the most
  // recent pair's second member is not possible without breaking a pair, so
  // it is left out of this round (will be paired once the pool evens out).
  const matches: Match[] = pairs.map(([a, b]) => ({
    matchId: new Types.ObjectId().toString(),
    homeTeamId: a.teamId,
    awayTeamId: b.teamId,
    isTwoLegged: false,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: SWISS_ALLOWS_PENALTIES,
  }));

  return matches;
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
