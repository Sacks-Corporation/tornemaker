import { apiDelete, apiGet, apiPatch, apiPost } from './api'
import type {
  CreateTournamentPayload,
  MatchResultPayload,
  Tournament,
  TournamentDetail,
  TournamentSummary,
  UpcomingMatch,
} from '../types/tournament.types'

// Llamados al backend del grupo "tournaments". Los hooks consumen estas
// funciones vía TanStack Query.

export const createTournament = (payload: CreateTournamentPayload): Promise<Tournament> =>
  apiPost<Tournament, CreateTournamentPayload>('/tournaments', payload)

// Listado liviano de torneos guardados del usuario (userId sale del JWT, no
// se manda por body/query). Sin fixtures/matches/standings.
export const getTournaments = (): Promise<TournamentSummary[]> =>
  apiGet<TournamentSummary[]>('/tournaments')

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

// Elimina un torneo guardado del usuario. El back hace un borrado lógico,
// pero de cara al front/usuario es un borrado definitivo (204 No Content).
export const deleteTournament = (tournamentId: string): Promise<void> =>
  apiDelete<void>(`/tournaments/${tournamentId}`)
