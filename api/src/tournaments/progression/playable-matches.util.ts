import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { TournamentState } from '../schemas/common/tournament-state.enum';
import { Tournament } from '../schemas/tournament.schema';
import {
  collectAllMatches,
  ConsoleAssigner,
  ensureAssignedConsole,
} from './console-assignment.util';
import { MatchPhase } from './match-locator.util';

export interface PlayableTeam {
  teamId: string;
  name: string;
  playerNames: string[];
}

export interface PlayableMatchItem {
  matchId: string;
  legNumber: 1 | 2;
  phase: MatchPhase;
  roundLabel: string;
  groupName?: string;
  homeTeam: PlayableTeam;
  awayTeam: PlayableTeam;
  assignedConsole: string;
  allowsPenalties: boolean;
  firstLegResult?: { homeGoals: number; awayGoals: number };
}

interface Candidate {
  match: Match;
  phase: MatchPhase;
  roundLabel: string;
  groupName?: string;
}

/** Which leg needs to be recorded next, or `null` if the match isn't
 *  currently playable (missing a team, or already fully resolved). */
function nextLegToPlay(match: Match): 1 | 2 | null {
  if (
    match.status === MatchStatus.PLAYED ||
    match.status === MatchStatus.WALKOVER
  ) {
    return null;
  }
  if (!match.homeTeamId || !match.awayTeamId) {
    return null;
  }
  if (!match.isTwoLegged) {
    return match.legs.length === 0 ? 1 : null;
  }
  if (match.legs.length === 0) return 1;
  if (match.legs.length === 1) return 2;
  return null;
}

function gatherCandidates(
  tournament: Pick<
    Tournament,
    'state' | 'leagueStage' | 'groupStage' | 'swissStage' | 'knockoutStage'
  >,
): Candidate[] {
  const candidates: Candidate[] = [];

  switch (tournament.state) {
    case TournamentState.LEAGUE: {
      const stage = tournament.leagueStage;
      if (!stage) break;
      for (const matchday of stage.matchdays) {
        for (const match of matchday.matches) {
          candidates.push({
            match,
            phase: 'LEAGUE',
            roundLabel: `Fecha ${matchday.roundNumber}`,
          });
        }
      }
      for (const match of stage.tiebreakMatches) {
        candidates.push({
          match,
          phase: 'TIEBREAK',
          roundLabel: 'Desempate de tabla',
        });
      }
      break;
    }

    case TournamentState.GROUPS: {
      const stage = tournament.groupStage;
      if (!stage) break;
      for (const group of stage.groups) {
        for (const match of group.matches) {
          candidates.push({
            match,
            phase: 'GROUPS',
            roundLabel: group.name,
            groupName: group.name,
          });
        }
      }
      for (const group of stage.groups) {
        for (const match of group.tiebreakMatches) {
          candidates.push({
            match,
            phase: 'TIEBREAK',
            roundLabel: `Desempate — ${group.name}`,
            groupName: group.name,
          });
        }
      }
      break;
    }

    case TournamentState.SWISS: {
      const stage = tournament.swissStage;
      if (!stage) break;
      for (const round of stage.rounds) {
        for (const match of round.matches) {
          candidates.push({
            match,
            phase: 'SWISS',
            roundLabel: `Ronda ${round.roundNumber}`,
          });
        }
      }
      for (const match of stage.playIn) {
        candidates.push({ match, phase: 'PLAY_IN', roundLabel: 'Play-in' });
      }
      break;
    }

    case TournamentState.KNOCKOUTS: {
      const bracket = tournament.knockoutStage?.bracket;
      if (!bracket) break;
      for (const round of bracket.rounds) {
        for (const match of round.matches) {
          const label =
            match.isTwoLegged && match.legs.length > 0
              ? `Vuelta — ${round.name}`
              : match.isTwoLegged
                ? `Ida — ${round.name}`
                : round.name;
          candidates.push({ match, phase: 'KNOCKOUTS', roundLabel: label });
        }
      }
      if (bracket.thirdPlaceMatch) {
        candidates.push({
          match: bracket.thirdPlaceMatch,
          phase: 'THIRD_PLACE',
          roundLabel: 'Tercer Puesto',
        });
      }
      break;
    }

    case TournamentState.FINISHED:
      break;
  }

  return candidates;
}

/**
 * Builds the list of matches that can be played RIGHT NOW, all of them
 * simultaneously (distinct teams, at most one per physical console unit) —
 * see the endpoint doc for the full contract. Assigns `assignedConsole` on
 * every newly-selected match (mutating the actual `Match` subdocuments —
 * the caller must persist the tournament afterwards if any assignment
 * happened, see `hasNewAssignments` below).
 */
export function computePlayableMatches(
  tournament: Pick<
    Tournament,
    | 'state'
    | 'leagueStage'
    | 'groupStage'
    | 'swissStage'
    | 'knockoutStage'
    | 'thirdPlaceMatch'
    | 'teams'
    | 'consoleUnits'
  >,
): { items: PlayableMatchItem[]; hasNewAssignments: boolean } {
  const candidates = gatherCandidates(tournament);
  const teamsById = new Map(
    tournament.teams.map((t) => [
      t.teamId.toString(),
      { teamId: t.teamId.toString(), name: t.name, playerNames: t.playerNames },
    ]),
  );

  const selected: Array<{ candidate: Candidate; legNumber: 1 | 2 }> = [];
  const usedTeamIds = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= tournament.consoleUnits.length) break;
    const legNumber = nextLegToPlay(candidate.match);
    if (legNumber === null) continue;

    const homeId = candidate.match.homeTeamId as string;
    const awayId = candidate.match.awayTeamId as string;
    if (usedTeamIds.has(homeId) || usedTeamIds.has(awayId)) continue;

    usedTeamIds.add(homeId);
    usedTeamIds.add(awayId);
    selected.push({ candidate, legNumber });
  }

  const alreadyAssignedCount = collectAllMatches(tournament).filter(
    (m) => m.assignedConsole,
  ).length;
  const assigner = new ConsoleAssigner(
    tournament.consoleUnits,
    alreadyAssignedCount,
  );

  let hasNewAssignments = false;
  const items: PlayableMatchItem[] = selected.map(
    ({ candidate, legNumber }) => {
      const { match } = candidate;
      const hadConsole = Boolean(match.assignedConsole);
      const assignedConsole = ensureAssignedConsole(match, assigner);
      if (!hadConsole) hasNewAssignments = true;

      const homeTeam = teamsById.get(match.homeTeamId as string);
      const awayTeam = teamsById.get(match.awayTeamId as string);
      if (!homeTeam || !awayTeam) {
        throw new Error(`Unknown team(s) for match ${match.matchId}`);
      }

      const allowsPenalties =
        match.allowsPenalties && (!match.isTwoLegged || legNumber === 2);

      return {
        matchId: match.matchId,
        legNumber,
        phase: candidate.phase,
        roundLabel: candidate.roundLabel,
        groupName: candidate.groupName,
        homeTeam,
        awayTeam,
        assignedConsole,
        allowsPenalties,
        firstLegResult:
          legNumber === 2
            ? {
                homeGoals: match.legs[0].homeGoals,
                awayGoals: match.legs[0].awayGoals,
              }
            : undefined,
      };
    },
  );

  return { items, hasNewAssignments };
}
