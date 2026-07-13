// Tipos del grupo "utils": catálogos dinámicos (consolas, modalidades y
// reglas de formato) que hoy viven en la base de datos del backend. Los
// consume principalmente el wizard de creación de torneo, y en menor medida
// las pantallas de visualización/carga de resultados (lookup code -> label).

import type { TournamentFormat } from './tournament.types'

// Ítem de GET /utils/consoles (ya ordenado, solo consolas activas).
export interface ConsoleCatalogItem {
  code: string
  label: string
  sortOrder: number
  isDefault: boolean
}

// Ítem de GET /utils/match-modes.
export interface MatchModeCatalogItem {
  code: string
  label: string
  playersPerTeam: number
  sortOrder: number
}

// Ítem de GET /utils/tournament-formats. Con el query param `format` viene un
// único elemento en el array (el back siempre explicita `teamCounts`, incluso
// para LEAGUE).
export interface TournamentFormatRules {
  format: TournamentFormat
  teamCounts: number[]
  groupSizesByTeamCount?: Record<number, number[]>
  allowsAi: boolean
  allowsThirdPlace: boolean
}
