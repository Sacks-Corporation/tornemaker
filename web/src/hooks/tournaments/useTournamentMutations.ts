import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTournament, deleteTournament, patchMatchResult, resetTournament } from '../../api/tournaments.api'
import type {
  CreateTournamentPayload,
  MatchResultPayload,
  Tournament,
  TournamentDetail,
} from '../../types/tournament.types'
import { tournamentQueryKeys } from './useTournamentQueries'

// Mutaciones de escritura del grupo "tournaments" (TanStack Query). Los
// containers consumen estos hooks; nunca llaman a axios ni a src/api
// directamente.

export function useCreateTournamentMutation() {
  const queryClient = useQueryClient()

  return useMutation<Tournament, unknown, CreateTournamentPayload>({
    mutationFn: createTournament,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list() })
    },
  })
}

export interface MatchResultMutationVariables {
  matchId: string
  payload: MatchResultPayload
}

// Carga el resultado de un partido. Al finalizar con éxito, refresca tanto el
// torneo completo como los próximos partidos jugables (la respuesta ya trae
// el torneo actualizado, así que además se guarda directo en cache).
export function useMatchResultMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation<TournamentDetail, unknown, MatchResultMutationVariables>({
    mutationFn: ({ matchId, payload }) => patchMatchResult(matchId, payload),
    onSuccess: (tournament) => {
      queryClient.setQueryData(tournamentQueryKeys.detail(tournamentId), tournament)
      void queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) })
      void queryClient.invalidateQueries({
        queryKey: tournamentQueryKeys.upcomingMatches(tournamentId),
      })
    },
  })
}

// Resetea un torneo (reinicia todos los partidos). Al finalizar con éxito, se
// comporta igual que useMatchResultMutation: la respuesta ya trae el torneo
// actualizado, así que se guarda directo en cache y además se invalidan
// detail + upcomingMatches para refrescar la pantalla completa.
export function useResetTournamentMutation(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation<TournamentDetail, unknown, void>({
    mutationFn: () => resetTournament(tournamentId),
    onSuccess: (tournament) => {
      queryClient.setQueryData(tournamentQueryKeys.detail(tournamentId), tournament)
      void queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.detail(tournamentId) })
      void queryClient.invalidateQueries({
        queryKey: tournamentQueryKeys.upcomingMatches(tournamentId),
      })
    },
  })
}

// Borra un torneo guardado desde el listado. Al finalizar con éxito, refresca
// el listado (la card eliminada deja de aparecer).
export function useDeleteTournamentMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: deleteTournament,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentQueryKeys.list() })
    },
  })
}
