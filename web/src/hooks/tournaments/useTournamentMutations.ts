import { useMutation } from '@tanstack/react-query'
import { createTournament } from '../../api/tournaments.api'
import type { CreateTournamentPayload, Tournament } from '../../types/tournament.types'

// Mutaciones de escritura del grupo "tournaments" (TanStack Query). El
// container de ConfirmationStep consume este hook; nunca llama a axios ni a
// src/api directamente.

export function useCreateTournamentMutation() {
  return useMutation<Tournament, unknown, CreateTournamentPayload>({
    mutationFn: createTournament,
  })
}
