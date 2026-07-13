import { Types } from 'mongoose';
import { SWISS_TARGET_QUALIFIERS } from '../dto/format-rules';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Match } from '../schemas/common/match.schema';
import {
  SwissParticipant,
  SwissRound,
  SwissStage,
} from '../schemas/swiss-stage.schema';
import { SeededTeam } from './types';

/** Swiss matches must always produce a winner — see Match.allowsPenalties doc. */
export const SWISS_ALLOWS_PENALTIES = true;

/**
 * Builds the initial SWISS_PLUS_ELIMINATION stage: every participant at
 * 0W-0L and a single round 1 with random pairings (the already-shuffled
 * team order). Rounds 2+ depend on round 1 (and later rounds') results —
 * pairing by score group, rematch avoidance, etc. — so they are generated
 * later by the results-recording flow, not here (see swiss-stage.schema.ts).
 *
 * `knockoutTwoLegged` is stored (not used here) purely so the progression
 * engine knows, once this Swiss stage finishes, whether the FOLLOW-UP
 * knockout bracket should be two-legged — the organizer's `twoLegged` choice
 * at creation time never applies to the Swiss matches themselves (always
 * single-leg, see `SWISS_ALLOWS_PENALTIES`/`Match.allowsPenalties`).
 */
export function buildSwissStage(
  teams: SeededTeam[],
  knockoutTwoLegged: boolean,
): SwissStage {
  const participants: SwissParticipant[] = teams.map((t) => ({
    teamId: t.hexId,
    wins: 0,
    losses: 0,
    isQualified: false,
    isEliminated: false,
    opponentTeamIds: [],
    gameDifferential: 0,
  }));

  const round1Matches: Match[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    round1Matches.push({
      matchId: new Types.ObjectId().toString(),
      homeTeamId: teams[i].hexId,
      awayTeamId: teams[i + 1].hexId,
      isTwoLegged: false,
      legs: [],
      status: MatchStatus.SCHEDULED,
      isDraw: false,
      allowsPenalties: SWISS_ALLOWS_PENALTIES,
    });
  }

  const rounds: SwissRound[] = [{ roundNumber: 1, matches: round1Matches }];

  const targetQualifiers = SWISS_TARGET_QUALIFIERS[teams.length];

  return {
    winsToQualify: 3,
    lossesToEliminate: 3,
    targetQualifiers,
    participants,
    rounds,
    playIn: [],
    qualifiedTeamIds: [],
    knockoutTwoLegged,
  };
}
