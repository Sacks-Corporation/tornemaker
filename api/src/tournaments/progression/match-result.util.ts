import { BadRequestException } from '@nestjs/common';
import { Match } from '../schemas/common/match.schema';
import { MatchResult } from '../schemas/common/match-result.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';

export interface RecordResultInput {
  homeGoals: number;
  awayGoals: number;
  penaltyWinnerTeamId?: string;
}

export interface RecordResultOutcome {
  /** 1 for the first leg ever recorded on this match, 2 for the second (two-legged only). */
  legNumber: 1 | 2;
  /** Whether the tie is now fully resolved (single-leg, or two-legged after leg 2). */
  isResolved: boolean;
  winnerTeamId?: string;
  isDraw: boolean;
}

/**
 * Validates and applies a single leg's result onto `match` (mutates it in
 * place: pushes the leg, and — once the tie is resolved — sets
 * `status`/`winnerTeamId`/`isDraw`). Does NOT persist anything; the caller
 * is responsible for saving the parent document.
 *
 * Semantics assumed for two-legged ties (see Match schema doc): `homeGoals`/
 * `awayGoals` on EVERY leg always refer to `match.homeTeamId`/
 * `match.awayTeamId` respectively — "home"/"away" are fixed labels for the
 * tie, not which side physically hosts a given leg. This keeps aggregate
 * scoring (`sum of homeGoals` vs `sum of awayGoals` across both legs)
 * unambiguous without requiring `MatchResult` to carry its own team
 * references.
 *
 * Throws `BadRequestException` for every invalid input described in the
 * PATCH endpoint's business rules (immutability, missing/extra
 * penaltyWinnerTeamId, team not part of the match, teams not yet known).
 */
export function recordMatchResult(
  match: Match,
  input: RecordResultInput,
  assignedConsole: string,
): RecordResultOutcome {
  if (!match.homeTeamId || !match.awayTeamId) {
    throw new BadRequestException(
      'This match is not playable yet: both teams are not known.',
    );
  }
  if (match.status === MatchStatus.PLAYED) {
    throw new BadRequestException(
      'This match result has already been recorded and cannot be edited.',
    );
  }
  if (match.status === MatchStatus.WALKOVER) {
    throw new BadRequestException(
      'This match was decided by walkover and cannot be edited.',
    );
  }

  const legNumber: 1 | 2 = match.legs.length === 0 ? 1 : 2;
  if (match.isTwoLegged && match.legs.length >= 2) {
    throw new BadRequestException(
      'Both legs of this tie have already been recorded.',
    );
  }
  if (!match.isTwoLegged && match.legs.length >= 1) {
    throw new BadRequestException(
      'This match result has already been recorded and cannot be edited.',
    );
  }

  const isDrawScore = input.homeGoals === input.awayGoals;

  // A leg only "decides" the tie by penalties when: it's a single-leg match
  // that doesn't allow draws, OR it's leg 2 of a two-legged tie AND the
  // aggregate (leg1 + this leg) is level.
  let aggregateHomeGoals = input.homeGoals;
  let aggregateAwayGoals = input.awayGoals;
  let decidesTheTie = !match.isTwoLegged || legNumber === 2;

  if (match.isTwoLegged && legNumber === 2) {
    const firstLeg = match.legs[0];
    aggregateHomeGoals = firstLeg.homeGoals + input.homeGoals;
    aggregateAwayGoals = firstLeg.awayGoals + input.awayGoals;
  } else if (match.isTwoLegged && legNumber === 1) {
    decidesTheTie = false;
  }

  const aggregateIsDraw = aggregateHomeGoals === aggregateAwayGoals;
  const requiresPenalties =
    decidesTheTie && match.allowsPenalties && aggregateIsDraw;

  if (requiresPenalties) {
    if (!input.penaltyWinnerTeamId) {
      throw new BadRequestException(
        'penaltyWinnerTeamId is required: this tie is level and must be decided by penalties.',
      );
    }
    if (
      input.penaltyWinnerTeamId !== match.homeTeamId &&
      input.penaltyWinnerTeamId !== match.awayTeamId
    ) {
      throw new BadRequestException(
        'penaltyWinnerTeamId must be one of the two teams in this match.',
      );
    }
  } else if (input.penaltyWinnerTeamId) {
    if (!match.allowsPenalties) {
      throw new BadRequestException(
        'penaltyWinnerTeamId is not allowed: this match/phase admits draws and is never decided by penalties.',
      );
    }
    throw new BadRequestException(
      'penaltyWinnerTeamId is not allowed: this leg does not need to be decided by penalties.',
    );
  }

  // Winner of THIS leg alone (undefined when the leg itself is level and
  // isn't the one deciding the tie by penalties — normal for leg 1 of a
  // two-legged tie, or for a drawn league/group/tiebreak match).
  let legWinnerTeamId: string | undefined;
  if (!isDrawScore) {
    legWinnerTeamId =
      input.homeGoals > input.awayGoals ? match.homeTeamId : match.awayTeamId;
  } else if (requiresPenalties) {
    legWinnerTeamId = input.penaltyWinnerTeamId;
  }

  const leg: MatchResult = {
    console: assignedConsole,
    homeGoals: input.homeGoals,
    awayGoals: input.awayGoals,
    wentToExtraTime: false,
    wentToPenalties: requiresPenalties,
    legWinnerTeamId,
    playedAt: new Date(),
  };
  match.legs.push(leg);

  const isResolved = !match.isTwoLegged || legNumber === 2;
  let winnerTeamId: string | undefined;
  let isDraw = false;

  if (isResolved) {
    if (!match.isTwoLegged) {
      if (isDrawScore && !requiresPenalties) {
        isDraw = true;
      } else {
        winnerTeamId = legWinnerTeamId;
      }
    } else {
      // Two-legged, leg 2 just recorded: decide by aggregate (+ penalties).
      if (aggregateIsDraw) {
        if (requiresPenalties) {
          winnerTeamId = input.penaltyWinnerTeamId;
        } else {
          isDraw = true;
        }
      } else {
        winnerTeamId =
          aggregateHomeGoals > aggregateAwayGoals
            ? match.homeTeamId
            : match.awayTeamId;
      }
    }

    match.status = MatchStatus.PLAYED;
    match.isDraw = isDraw;
    match.winnerTeamId = winnerTeamId;
  }

  return { legNumber, isResolved, winnerTeamId, isDraw };
}
