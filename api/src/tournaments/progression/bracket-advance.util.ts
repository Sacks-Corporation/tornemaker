import { Bracket } from '../schemas/common/bracket.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';

/**
 * Advances a just-resolved knockout match's winner (and, when applicable,
 * loser) into the correct slot of the following structure. Mutates
 * `bracket` in place.
 *
 * A single generic positional rule feeds every round transition, matching
 * exactly how `draw/knockout-fixtures.ts` lays the bracket out: match `i` of
 * a round feeds match `floor(virtualIndex / 2)` of the next round, as the
 * HOME side if `virtualIndex` is even, AWAY if odd — where:
 *   - For every round EXCEPT the preliminary round, `virtualIndex = i`
 *     directly: every round after the first main round is built as a clean,
 *     unseeded placeholder bracket (see knockout-fixtures.ts), so nothing
 *     else dictates a different pairing.
 *   - For the preliminary round specifically (`roundIndex === 0` when
 *     `bracket.hasPreliminaryRound`), `virtualIndex = bracket.byeTeamIds.length + i`.
 *     This offset exists because `knockout-fixtures.ts` lays the first main
 *     round's `firstMainSize` entrants out as a flat list — the
 *     `byeTeamIds.length` bye teams FIRST (already known, filled in
 *     directly), THEN one pending-winner slot per preliminary match, in
 *     order — before pairing that flat list 2-by-2 into matches. Using the
 *     bye count as an offset before applying the exact same floor(i/2)/
 *     parity rule reproduces that layout generically, for ANY split between
 *     byes and preliminary matches (some main-round matches may end up bye
 *     vs bye, bye vs winner, or winner vs winner — see knockout-fixtures.ts).
 *
 * Additionally:
 *   - When `roundIndex` is the semifinal round (the second-to-last round)
 *     and `bracket.hasThirdPlaceMatch`, the LOSER is placed into
 *     `bracket.thirdPlaceMatch` (home for the first semifinal, away for the
 *     second).
 *   - When `roundIndex` is the last round (the final), `winnerTeamId` is
 *     recorded as `bracket.championTeamId`.
 */
export function advanceWinnerInBracket(
  bracket: Bracket,
  roundIndex: number,
  matchIndex: number,
  winnerTeamId: string,
  loserTeamId?: string,
): void {
  const lastRoundIndex = bracket.rounds.length - 1;
  const isFinal = roundIndex === lastRoundIndex;
  const isSemifinal = roundIndex === lastRoundIndex - 1;

  if (isSemifinal && bracket.hasThirdPlaceMatch && bracket.thirdPlaceMatch) {
    if (matchIndex === 0) {
      bracket.thirdPlaceMatch.homeTeamId = loserTeamId;
    } else if (matchIndex === 1) {
      bracket.thirdPlaceMatch.awayTeamId = loserTeamId;
    }
  }

  if (isFinal) {
    bracket.championTeamId = winnerTeamId;
    return;
  }

  const nextRound = bracket.rounds[roundIndex + 1];
  const feedsFromPreliminary = roundIndex === 0 && bracket.hasPreliminaryRound;
  const virtualIndex = feedsFromPreliminary
    ? bracket.byeTeamIds.length + matchIndex
    : matchIndex;

  const nextMatchIndex = Math.floor(virtualIndex / 2);
  const nextMatch = nextRound.matches[nextMatchIndex];
  if (virtualIndex % 2 === 0) {
    nextMatch.homeTeamId = winnerTeamId;
  } else {
    nextMatch.awayTeamId = winnerTeamId;
  }
}

function isMatchDone(status: MatchStatus): boolean {
  return status === MatchStatus.PLAYED || status === MatchStatus.WALKOVER;
}

/** True once the final (and 3rd-place match, if any) have both been played. */
export function isBracketComplete(bracket: Bracket): boolean {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  if (!finalMatch || !isMatchDone(finalMatch.status)) {
    return false;
  }
  if (bracket.hasThirdPlaceMatch) {
    if (
      !bracket.thirdPlaceMatch ||
      !isMatchDone(bracket.thirdPlaceMatch.status)
    ) {
      return false;
    }
  }
  return true;
}
