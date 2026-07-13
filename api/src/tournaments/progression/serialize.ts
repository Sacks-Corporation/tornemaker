import { Match } from '../schemas/common/match.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Standing } from '../schemas/common/standing.schema';
import { TournamentFormat } from '../schemas/common/tournament-format.enum';
import { TournamentState } from '../schemas/common/tournament-state.enum';
import { Group } from '../schemas/group-stage.schema';
import { SwissParticipant, SwissStage } from '../schemas/swiss-stage.schema';
import {
  TournamentDocument,
  TournamentStatus,
} from '../schemas/tournament.schema';

export interface SerializedMatchResult {
  console: string;
  homeGoals: number;
  awayGoals: number;
  wentToPenalties: boolean;
  legWinnerTeamId?: string;
}

export interface SerializedMatch {
  matchId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  isTwoLegged: boolean;
  legs: SerializedMatchResult[];
  status: MatchStatus;
  winnerTeamId?: string;
  isDraw: boolean;
  allowsPenalties: boolean;
  assignedConsole?: string;
}

export function serializeMatch(match: Match): SerializedMatch {
  return {
    matchId: match.matchId,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    isTwoLegged: match.isTwoLegged,
    legs: match.legs.map((leg) => ({
      console: leg.console,
      homeGoals: leg.homeGoals,
      awayGoals: leg.awayGoals,
      wentToPenalties: leg.wentToPenalties,
      legWinnerTeamId: leg.legWinnerTeamId,
    })),
    status: match.status,
    winnerTeamId: match.winnerTeamId,
    isDraw: match.isDraw,
    allowsPenalties: match.allowsPenalties,
    assignedConsole: match.assignedConsole,
  };
}

function serializeStanding(standing: Standing) {
  return {
    teamId: standing.teamId,
    played: standing.played,
    won: standing.won,
    drawn: standing.drawn,
    lost: standing.lost,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    goalDifference: standing.goalDifference,
    points: standing.points,
    rank: standing.rank,
  };
}

function serializeGroup(group: Group) {
  return {
    name: group.name,
    teamIds: group.teamIds,
    matches: group.matches.map(serializeMatch),
    standings: group.standings.map(serializeStanding),
    tiebreakMatches: group.tiebreakMatches.map(serializeMatch),
  };
}

/**
 * Derives, per participant, the matchId in which the team clinched its fate
 * (the win that reached `winsToQualify` or the loss that reached
 * `lossesToEliminate`). Reconstructed from the immutable match log by
 * replaying rounds in order, so it is always correct for any tournament —
 * including ones created before this was exposed — with no stored field to
 * keep in sync. The UI uses it to highlight ONLY the decisive match.
 */
export function computeSwissDecidedMatchIds(
  stage: SwissStage,
): Map<string, string> {
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const decided = new Map<string, string>();

  for (const round of stage.rounds) {
    for (const match of round.matches) {
      if (
        match.status === MatchStatus.SCHEDULED ||
        !match.winnerTeamId ||
        !match.homeTeamId ||
        !match.awayTeamId
      ) {
        continue;
      }

      const winnerId = match.winnerTeamId;
      const loserId =
        winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

      const winnerWins = (wins.get(winnerId) ?? 0) + 1;
      const loserLosses = (losses.get(loserId) ?? 0) + 1;
      wins.set(winnerId, winnerWins);
      losses.set(loserId, loserLosses);

      if (!decided.has(winnerId) && winnerWins >= stage.winsToQualify) {
        decided.set(winnerId, match.matchId);
      }
      if (!decided.has(loserId) && loserLosses >= stage.lossesToEliminate) {
        decided.set(loserId, match.matchId);
      }
    }
  }

  return decided;
}

function serializeSwissParticipant(
  participant: SwissParticipant,
  decidedInMatchId?: string,
) {
  return {
    teamId: participant.teamId,
    wins: participant.wins,
    losses: participant.losses,
    isQualified: participant.isQualified,
    isEliminated: participant.isEliminated,
    gameDifferential: participant.gameDifferential,
    decidedInMatchId,
  };
}

export interface SerializedTournament {
  _id: string;
  name: string;
  format: TournamentFormat;
  state: TournamentState;
  status: TournamentStatus;
  matchMode: string;
  consoleUnits: string[];
  allowedConsoles: string[];
  teams: Array<{ teamId: string; name: string; playerNames: string[] }>;
  leagueStage?: {
    doubleRound: boolean;
    pointsForWin: number;
    pointsForDraw: number;
    pointsForLoss: number;
    matchdays: Array<{ roundNumber: number; matches: SerializedMatch[] }>;
    standings: ReturnType<typeof serializeStanding>[];
    tiebreakMatches: SerializedMatch[];
  };
  groupStage?: {
    groupSize: number;
    doubleRound: boolean;
    groups: ReturnType<typeof serializeGroup>[];
    bestThirdPlaceSlots: number;
    qualifiedThirdPlaceTeamIds: string[];
  };
  swissStage?: {
    winsToQualify: number;
    lossesToEliminate: number;
    targetQualifiers: number;
    participants: ReturnType<typeof serializeSwissParticipant>[];
    rounds: Array<{ roundNumber: number; matches: SerializedMatch[] }>;
    playIn: SerializedMatch[];
    qualifiedTeamIds: string[];
  };
  knockoutStage?: {
    bracket: {
      drawSize: number;
      byeTeamIds: string[];
      hasPreliminaryRound: boolean;
      rounds: Array<{
        roundNumber: number;
        name: string;
        matches: SerializedMatch[];
      }>;
      isTwoLegged: boolean;
      hasThirdPlaceMatch: boolean;
      thirdPlaceMatch?: SerializedMatch;
      championTeamId?: string;
    };
  };
  thirdPlaceMatch?: SerializedMatch;
}

export interface SerializedTournamentSummary {
  _id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  teamCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Lightweight per-tournament summary for `GET /tournaments` (the
 * dashboard/cards listing screen) — deliberately excludes the internal
 * structure (fixtures, matches, standings, bracket): only the metadata a
 * card needs. See `serializeTournament` below for the full shape used by
 * `GET /tournaments/:id`. */
export function serializeTournamentSummary(
  tournament: TournamentDocument,
): SerializedTournamentSummary {
  const { createdAt, updatedAt } = tournament as unknown as {
    createdAt: Date;
    updatedAt: Date;
  };
  return {
    _id: (tournament._id as { toString(): string }).toString(),
    name: tournament.name,
    format: tournament.format,
    status: tournament.status,
    teamCount: tournament.teams.length,
    createdAt,
    updatedAt,
  };
}

/** Full tournament serialization for `GET /tournaments/:id` — the exact
 * shape the frontend contract depends on (see tournaments.controller.ts). */
export function serializeTournament(
  tournament: TournamentDocument,
): SerializedTournament {
  return {
    _id: (tournament._id as { toString(): string }).toString(),
    name: tournament.name,
    format: tournament.format,
    state: tournament.state,
    status: tournament.status,
    matchMode: tournament.matchMode,
    consoleUnits: tournament.consoleUnits,
    allowedConsoles: tournament.allowedConsoles,
    teams: tournament.teams.map((t) => ({
      teamId: t.teamId.toString(),
      name: t.name,
      playerNames: t.playerNames,
    })),
    leagueStage: tournament.leagueStage
      ? {
          doubleRound: tournament.leagueStage.doubleRound,
          pointsForWin: tournament.leagueStage.pointsForWin,
          pointsForDraw: tournament.leagueStage.pointsForDraw,
          pointsForLoss: tournament.leagueStage.pointsForLoss,
          matchdays: tournament.leagueStage.matchdays.map((md) => ({
            roundNumber: md.roundNumber,
            matches: md.matches.map(serializeMatch),
          })),
          standings: tournament.leagueStage.standings.map(serializeStanding),
          tiebreakMatches:
            tournament.leagueStage.tiebreakMatches.map(serializeMatch),
        }
      : undefined,
    groupStage: tournament.groupStage
      ? {
          groupSize: tournament.groupStage.groupSize,
          doubleRound: tournament.groupStage.doubleRound,
          groups: tournament.groupStage.groups.map(serializeGroup),
          bestThirdPlaceSlots: tournament.groupStage.bestThirdPlaceSlots,
          qualifiedThirdPlaceTeamIds:
            tournament.groupStage.qualifiedThirdPlaceTeamIds,
        }
      : undefined,
    swissStage: tournament.swissStage
      ? {
          winsToQualify: tournament.swissStage.winsToQualify,
          lossesToEliminate: tournament.swissStage.lossesToEliminate,
          targetQualifiers: tournament.swissStage.targetQualifiers,
          participants: (() => {
            const decidedByTeam = computeSwissDecidedMatchIds(
              tournament.swissStage,
            );
            return tournament.swissStage.participants.map((p) =>
              serializeSwissParticipant(p, decidedByTeam.get(p.teamId)),
            );
          })(),
          rounds: tournament.swissStage.rounds.map((r) => ({
            roundNumber: r.roundNumber,
            matches: r.matches.map(serializeMatch),
          })),
          playIn: tournament.swissStage.playIn.map(serializeMatch),
          qualifiedTeamIds: tournament.swissStage.qualifiedTeamIds,
        }
      : undefined,
    knockoutStage: tournament.knockoutStage
      ? {
          bracket: {
            drawSize: tournament.knockoutStage.bracket.drawSize,
            byeTeamIds: tournament.knockoutStage.bracket.byeTeamIds,
            hasPreliminaryRound:
              tournament.knockoutStage.bracket.hasPreliminaryRound,
            rounds: tournament.knockoutStage.bracket.rounds.map((r) => ({
              roundNumber: r.roundNumber,
              name: r.name,
              matches: r.matches.map(serializeMatch),
            })),
            isTwoLegged: tournament.knockoutStage.bracket.isTwoLegged,
            hasThirdPlaceMatch:
              tournament.knockoutStage.bracket.hasThirdPlaceMatch,
            thirdPlaceMatch: tournament.knockoutStage.bracket.thirdPlaceMatch
              ? serializeMatch(tournament.knockoutStage.bracket.thirdPlaceMatch)
              : undefined,
            championTeamId: tournament.knockoutStage.bracket.championTeamId,
          },
        }
      : undefined,
    thirdPlaceMatch: tournament.thirdPlaceMatch
      ? serializeMatch(tournament.thirdPlaceMatch)
      : undefined,
  };
}
