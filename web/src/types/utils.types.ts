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
// único elemento en el array.
//
// - `teamRange`: presente para los formatos que aceptan un `teamCount` libre
//   dentro de `[min, max]` (validación por RANGO, no por tabla cerrada):
//   SINGLE_ELIMINATION {min:4,max:64}, GROUP_STAGE_PLUS_ELIMINATION
//   {min:6,max:64}, LEAGUE {min:4,max:30}. Ausente para SWISS_PLUS_ELIMINATION.
// - `teamCounts`: presente SOLO para SWISS_PLUS_ELIMINATION (set cerrado de
//   valores soportados). Ausente para el resto.
// - `groupCap`: presente SOLO para GROUP_STAGE_PLUS_ELIMINATION — `{min: 3}`,
//   el tope mínimo de equipos por grupo permitido. No hay `max`: cualquier
//   `groupCap >= min` se acepta siempre que la combinación con `teamCount`
//   sea una distribución de grupos válida (ver `computeGroupDistribution` en
//   `utils/tournament.utils.ts`).
export interface TournamentFormatRules {
  format: TournamentFormat
  teamRange?: { min: number; max: number }
  teamCounts?: number[]
  groupCap?: { min: number }
  allowsAi: boolean
  allowsThirdPlace: boolean
}
