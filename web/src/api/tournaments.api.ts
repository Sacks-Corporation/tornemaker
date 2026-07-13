import { apiGet, apiPatch, apiPost } from './api'
import type {
  CreateTournamentPayload,
  MatchResultPayload,
  Tournament,
  TournamentDetail,
  UpcomingMatch,
} from '../types/tournament.types'

// Llamados al backend del grupo "tournaments". Los hooks consumen estas
// funciones vía TanStack Query.

export const createTournament = (payload: CreateTournamentPayload): Promise<Tournament> =>
  apiPost<Tournament, CreateTournamentPayload>('/tournaments', payload)

// Torneo completo (fases, tablas, brackets) para la pantalla de simulación.
export const getTournament = (tournamentId: string): Promise<TournamentDetail> =>
  apiGet<TournamentDetail>(`/tournaments/${tournamentId}`)

// Próximos partidos jugables en simultáneo (barra superior de la pantalla).
export const getTournamentUpcomingMatches = (tournamentId: string): Promise<UpcomingMatch[]> =>
  apiGet<UpcomingMatch[]>(`/tournaments/${tournamentId}/matches`)

// Carga el resultado de un partido. La respuesta es el torneo actualizado
// completo (misma forma que getTournament).
export const patchMatchResult = (
  matchId: string,
  payload: MatchResultPayload,
): Promise<TournamentDetail> =>
  apiPatch<TournamentDetail, MatchResultPayload>(`/tournaments/match/${matchId}`, payload)
