import { apiPost } from './api'
import type { CreateTournamentPayload, Tournament } from '../types/tournament.types'

// Llamados al backend del grupo "tournaments". Los hooks consumen estas
// funciones vía TanStack Query.

export const createTournament = (payload: CreateTournamentPayload): Promise<Tournament> =>
  apiPost<Tournament, CreateTournamentPayload>('/tournaments', payload)
