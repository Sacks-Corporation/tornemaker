import { useQuery } from '@tanstack/react-query'
import { getTournament, getTournamentUpcomingMatches, getTournaments } from '../../api/tournaments.api'
import type { TournamentDetail, TournamentSummary, UpcomingMatch } from '../../types/tournament.types'

// Lecturas del grupo "tournaments" (TanStack Query). Los containers de
// TournamentPage/TournamentListPage consumen estos hooks; nunca llaman a
// axios ni a src/api directamente.

// `queryKey`s consistentes, reutilizadas también por las mutaciones para
// invalidar/actualizar la cache tras cargar un resultado o crear un torneo.
export const tournamentQueryKeys = {
  list: () => ['tournaments'] as const,
  detail: (tournamentId: string) => ['tournament', tournamentId] as const,
  upcomingMatches: (tournamentId: string) => ['tournament', tournamentId, 'matches'] as const,
}

// Listado de torneos guardados del usuario autenticado, para la pantalla de
// listado (/tournaments).
export function useTournamentsQuery() {
  return useQuery<TournamentSummary[]>({
    queryKey: tournamentQueryKeys.list(),
    queryFn: getTournaments,
  })
}

export function useTournamentQuery(tournamentId: string) {
  return useQuery<TournamentDetail>({
    queryKey: tournamentQueryKeys.detail(tournamentId),
    queryFn: () => getTournament(tournamentId),
    enabled: tournamentId.length > 0,
  })
}

export function useUpcomingMatchesQuery(tournamentId: string) {
  return useQuery<UpcomingMatch[]>({
    queryKey: tournamentQueryKeys.upcomingMatches(tournamentId),
    queryFn: () => getTournamentUpcomingMatches(tournamentId),
    enabled: tournamentId.length > 0,
  })
}
