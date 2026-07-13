import { Bracket } from '../schemas/common/bracket.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';

/**
 * Advances a just-resolved knockout match's winner (and, when applicable,
 * loser) into the correct slot of the following structure. Mutates
 * `bracket` in place.
 *
 * Two distinct feeding rules coexist, matching exactly how
 * `draw/knockout-fixtures.ts` originally laid the bracket out:
 *
 *   1. Preliminary round (`roundIndex === 0` when `bracket.hasPreliminaryRound`):
 *      every preliminary match's winner fills the AWAY slot of the main
 *      round's match at the SAME index (the HOME slot there is always
 *      already occupied by a bye team — see the worked byes/preliminary
 *      round design in bracket.schema.ts and the slot-building code in
 *      knockout-fixtures.ts). This is intentionally NOT `floor(i/2)`.
 *
 *   2. Every other round transition (including main-round-1 -> quarters,
 *      quarters -> semis, semis -> final): the generic single-elimination
 *      positional rule — match `i` feeds match `floor(i/2)` of the next
 *      round, as the HOME side if `i` is even, AWAY if `i` is odd. This is
 *      correct here because every round after the first main round is built
 *      as a clean, unseeded placeholder bracket (see knockout-fixtures.ts),
 *      so nothing else dictates a different pairing.
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

  if (feedsFromPreliminary) {
    // Identity mapping, always into the away slot (see doc above).
    nextRound.matches[matchIndex].awayTeamId = winnerTeamId;
  } else {
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    if (matchIndex % 2 === 0) {
      nextMatch.homeTeamId = winnerTeamId;
    } else {
      nextMatch.awayTeamId = winnerTeamId;
    }
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
