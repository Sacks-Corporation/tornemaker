// Tipos del grupo de páginas "tournaments" (creación y simulación de torneos)

export type TournamentFormat =
  | 'LEAGUE'
  | 'SINGLE_ELIMINATION'
  | 'GROUP_STAGE_PLUS_ELIMINATION'
  | 'SWISS_PLUS_ELIMINATION'

export type MatchMode = '1v1' | '2v2' | '3v3'

export type ConsoleType = 'PLAY_2' | 'PLAY_3' | 'PLAY_4' | 'PLAY_5'

// Método elegido para asignar los jugadores cargados a los equipos.
export type AssignmentMethod = 'MANUAL' | 'DRAW' | 'ROULETTE'

export interface TeamAssignment {
  teamIndex: number
  players: string[]
}

// Body de POST /tournaments
export interface CreateTournamentPayload {
  name: string
  format: TournamentFormat
  teamCount: number
  matchMode: MatchMode
  twoLegged: boolean
  thirdPlaceMatch: boolean
  groupSize?: number
  consoles: ConsoleType[]
  teams: string[]
  players: string[]
  assignments: TeamAssignment[]
}

// Documento Mongo devuelto por la API (201) al crear el torneo.
export interface Tournament {
  _id: string
  name: string
  format: TournamentFormat
  teamCount: number
  matchMode: MatchMode
  twoLegged: boolean
  thirdPlaceMatch: boolean
  groupSize?: number
  consoles: ConsoleType[]
  teams: string[]
  players: string[]
  assignments: TeamAssignment[]
}

// Steps del wizard de creación de torneo. `teamPlayers` solo se visita cuando
// el método de asignación elegido es manual.
export type NewTournamentStep =
  | 'format'
  | 'parameters'
  | 'teams'
  | 'players'
  | 'teamPlayers'
  | 'confirmation'

// Estado completo del wizard, persistido en sessionStorage.
export interface NewTournamentWizardData {
  step: NewTournamentStep
  format: TournamentFormat | null
  name: string
  teamCount: number | null
  groupSize: number | null
  twoLegged: boolean | null
  thirdPlaceMatch: boolean | null
  matchMode: MatchMode | null
  consoleCount: number | null
  consoles: ConsoleType[]
  teams: string[]
  players: string[]
  assignmentMethod: AssignmentMethod | null
  assignments: TeamAssignment[]
}
