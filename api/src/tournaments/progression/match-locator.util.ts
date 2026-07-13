import { Match } from '../schemas/common/match.schema';
import { Tournament } from '../schemas/tournament.schema';

export type MatchPhase =
  | 'LEAGUE'
  | 'GROUPS'
  | 'SWISS'
  | 'KNOCKOUTS'
  | 'PLAY_IN'
  | 'TIEBREAK'
  | 'THIRD_PLACE';

export interface MatchLocation {
  match: Match;
  phase: MatchPhase;
  /** Index into `groupStage.groups` — only for GROUPS / a group's TIEBREAK. */
  groupIndex?: number;
  /** True when `phase === 'TIEBREAK'` and it's the league's table tiebreak
   *  (as opposed to a group's tiebreak, which instead carries `groupIndex`). */
  isLeagueTiebreak?: boolean;
  /** Index into the containing matches array (bracket round / league
   *  matchday / swiss round) — needed by bracket advancement's positional
   *  rule (see bracket-advance.util.ts). */
  matchIndex?: number;
  /** Index into `knockoutStage.bracket.rounds` — only for KNOCKOUTS. */
  roundIndex?: number;
}

/**
 * Finds a match by its globally-unique `matchId` anywhere in the tournament
 * (across every phase/format), returning both the match itself (a direct
 * reference — mutate it in place, the caller saves the parent document) and
 * enough context for the progression engine to know what to recompute.
 */
export function locateMatch(
  tournament: Pick<
    Tournament,
    | 'leagueStage'
    | 'groupStage'
    | 'swissStage'
    | 'knockoutStage'
    | 'thirdPlaceMatch'
  >,
  matchId: string,
): MatchLocation | undefined {
  if (tournament.leagueStage) {
    for (const matchday of tournament.leagueStage.matchdays) {
      const matchIndex = matchday.matches.findIndex(
        (m) => m.matchId === matchId,
      );
      if (matchIndex !== -1) {
        return {
          match: matchday.matches[matchIndex],
          phase: 'LEAGUE',
          matchIndex,
        };
      }
    }
    const tbIndex = tournament.leagueStage.tiebreakMatches.findIndex(
      (m) => m.matchId === matchId,
    );
    if (tbIndex !== -1) {
      return {
        match: tournament.leagueStage.tiebreakMatches[tbIndex],
        phase: 'TIEBREAK',
        isLeagueTiebreak: true,
        matchIndex: tbIndex,
      };
    }
  }

  if (tournament.groupStage) {
    for (let gi = 0; gi < tournament.groupStage.groups.length; gi++) {
      const group = tournament.groupStage.groups[gi];
      const matchIndex = group.matches.findIndex((m) => m.matchId === matchId);
      if (matchIndex !== -1) {
        return {
          match: group.matches[matchIndex],
          phase: 'GROUPS',
          groupIndex: gi,
          matchIndex,
        };
      }
      const tbIndex = group.tiebreakMatches.findIndex(
        (m) => m.matchId === matchId,
      );
      if (tbIndex !== -1) {
        return {
          match: group.tiebreakMatches[tbIndex],
          phase: 'TIEBREAK',
          groupIndex: gi,
          matchIndex: tbIndex,
        };
      }
    }
  }

  if (tournament.swissStage) {
    for (let ri = 0; ri < tournament.swissStage.rounds.length; ri++) {
      const round = tournament.swissStage.rounds[ri];
      const matchIndex = round.matches.findIndex((m) => m.matchId === matchId);
      if (matchIndex !== -1) {
        return {
          match: round.matches[matchIndex],
          phase: 'SWISS',
          roundIndex: ri,
          matchIndex,
        };
      }
    }
    const piIndex = tournament.swissStage.playIn.findIndex(
      (m) => m.matchId === matchId,
    );
    if (piIndex !== -1) {
      return {
        match: tournament.swissStage.playIn[piIndex],
        phase: 'PLAY_IN',
        matchIndex: piIndex,
      };
    }
  }

  if (tournament.knockoutStage) {
    const rounds = tournament.knockoutStage.bracket.rounds;
    for (let ri = 0; ri < rounds.length; ri++) {
      const matchIndex = rounds[ri].matches.findIndex(
        (m) => m.matchId === matchId,
      );
      if (matchIndex !== -1) {
        return {
          match: rounds[ri].matches[matchIndex],
          phase: 'KNOCKOUTS',
          roundIndex: ri,
          matchIndex,
        };
      }
    }
    if (tournament.knockoutStage.bracket.thirdPlaceMatch?.matchId === matchId) {
      return {
        match: tournament.knockoutStage.bracket.thirdPlaceMatch,
        phase: 'THIRD_PLACE',
      };
    }
  }

  if (tournament.thirdPlaceMatch?.matchId === matchId) {
    return { match: tournament.thirdPlaceMatch, phase: 'THIRD_PLACE' };
  }

  return undefined;
}
