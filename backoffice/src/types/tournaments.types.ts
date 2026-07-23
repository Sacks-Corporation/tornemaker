// Tipos del grupo de páginas "tournaments" (listado de torneos del backoffice)

// Espejo de `TournamentFormat` (api). Formato/estructura del torneo.
export type TournamentFormat =
  | 'SINGLE_ELIMINATION'
  | 'GROUP_STAGE_PLUS_ELIMINATION'
  | 'LEAGUE'
  | 'SWISS_PLUS_ELIMINATION'

// Espejo de `TournamentStatus` (api). Estado general del torneo.
export type TournamentStatus = 'EN_PROGRESO' | 'TERMINADO'

// Espejo de `TournamentState` (api). Etapa/fase actual en la que está el
// torneo dentro de su formato.
export type TournamentState =
  | 'LEAGUE'
  | 'GROUPS'
  | 'SWISS'
  | 'KNOCKOUTS'
  | 'FINISHED'
  | 'DELETED'

// Fila devuelta por `GET /tournaments/backoffice`. `createdAt`/`updatedAt`
// viajan serializadas como ISO string (JSON).
export interface TournamentListItem {
  id: string
  name: string
  format: TournamentFormat
  teamCount: number
  consoleCount: number
  status: TournamentStatus
  // Puede venir `null`: los torneos creados antes de que `state` se poblara
  // consistentemente no lo tienen. La UI muestra "—" en ese caso.
  state: TournamentState | null
  createdAt: string
  updatedAt: string
}
