import { apiGet } from './api'
import type {
  ConsoleCatalogItem,
  MatchModeCatalogItem,
  TournamentFormatRules,
} from '../types/utils.types'
import type { TournamentFormat } from '../types/tournament.types'

// Llamados al backend del grupo "utils": catálogos dinámicos consumidos por
// el wizard de creación de torneo (consolas, modalidades, reglas de
// formato). Los hooks consumen estas funciones vía TanStack Query.

export const getConsoles = (): Promise<ConsoleCatalogItem[]> =>
  apiGet<ConsoleCatalogItem[]>('/utils/consoles')

export const getMatchModes = (): Promise<MatchModeCatalogItem[]> =>
  apiGet<MatchModeCatalogItem[]>('/utils/match-modes')

// Con el query param `format` la respuesta trae un único elemento.
export const getTournamentFormatRules = (
  format: TournamentFormat,
): Promise<TournamentFormatRules[]> =>
  apiGet<TournamentFormatRules[]>('/utils/tournament-formats', { params: { format } })
