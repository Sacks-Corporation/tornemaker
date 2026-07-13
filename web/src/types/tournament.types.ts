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

// --------------------------------------------------------------------------
// Visualización de torneo y carga de resultados (GET /tournaments/:id,
// GET /tournaments/:id/matches, PATCH /tournaments/match/:matchId).
//
// El front NUNCA calcula lógica de torneo (posiciones, avance, clasificados,
// próximos partidos): solo pinta lo que devuelve la API. La única cuenta
// permitida es el global ida+vuelta que se muestra en el modal de carga como
// conveniencia visual (el back valida igual).

export type TournamentState = 'LEAGUE' | 'GROUPS' | 'SWISS' | 'KNOCKOUTS' | 'FINISHED'

export type TournamentStatus = 'EN_PROGRESO' | 'TERMINADO'

export type MatchStatus = 'SCHEDULED' | 'PLAYED' | 'WALKOVER'

// Ítem de GET /tournaments: metadata liviana de un torneo guardado del
// usuario (sin fixtures/matches/standings), usada en la pantalla de listado.
export interface TournamentSummary {
  _id: string
  name: string
  format: TournamentFormat
  status: TournamentStatus
  teamCount: number
  createdAt: string
  updatedAt: string
}

export interface MatchLeg {
  console: string
  homeGoals: number
  awayGoals: number
  wentToPenalties: boolean
  legWinnerTeamId?: string
}

// Bloque común a todas las fases.
export interface Match {
  matchId: string
  homeTeamId?: string
  awayTeamId?: string
  isTwoLegged: boolean
  legs: MatchLeg[]
  status: MatchStatus
  // Quién avanza. Separado del marcador: puede definirse por penales.
  winnerTeamId?: string
  isDraw: boolean
  allowsPenalties: boolean
  assignedConsole?: ConsoleType
}

// Fila de tabla de posiciones. Ya viene ordenada y con `rank` desde el back.
export interface Standing {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  rank?: number
}

export interface TournamentTeam {
  teamId: string
  name: string
  playerNames: string[]
}

export interface Matchday {
  roundNumber: number
  matches: Match[]
}

export interface LeagueStage {
  doubleRound: boolean
  matchdays: Matchday[]
  standings: Standing[]
  tiebreakMatches: Match[]
}

export interface Group {
  name: string
  teamIds: string[]
  matches: Match[]
  standings: Standing[]
  tiebreakMatches: Match[]
}

export interface GroupStage {
  groupSize: number
  doubleRound: boolean
  groups: Group[]
  bestThirdPlaceSlots: number
  qualifiedThirdPlaceTeamIds: string[]
}

export interface SwissParticipant {
  teamId: string
  wins: number
  losses: number
  isQualified: boolean
  isEliminated: boolean
  gameDifferential: number
  // matchId del partido en el que el equipo selló su clasificación o
  // eliminación (la 3ra victoria/derrota). Lo provee el back.
  decidedInMatchId?: string
}

export interface SwissRound {
  roundNumber: number
  matches: Match[]
}

export interface SwissStage {
  winsToQualify: number
  lossesToEliminate: number
  targetQualifiers: number
  participants: SwissParticipant[]
  rounds: SwissRound[]
  playIn: Match[]
  qualifiedTeamIds: string[]
}

export interface BracketRound {
  roundNumber: number
  name: string
  matches: Match[]
}

export interface Bracket {
  drawSize: number
  rounds: BracketRound[]
  isTwoLegged: boolean
  hasThirdPlaceMatch: boolean
  thirdPlaceMatch?: Match
  championTeamId?: string
  byeTeamIds: string[]
  hasPreliminaryRound: boolean
}

export interface KnockoutStage {
  bracket: Bracket
}

// Documento completo devuelto por GET /tournaments/:id. Distinto del
// `Tournament` de arriba (forma devuelta al crear el torneo).
export interface TournamentDetail {
  _id: string
  name: string
  format: TournamentFormat
  state: TournamentState
  status: TournamentStatus
  matchMode: MatchMode
  consoleUnits: number
  allowedConsoles: ConsoleType[]
  teams: TournamentTeam[]
  leagueStage?: LeagueStage
  groupStage?: GroupStage
  swissStage?: SwissStage
  knockoutStage?: KnockoutStage
  thirdPlaceMatch?: Match
}

export type MatchPhase =
  | 'LEAGUE'
  | 'GROUPS'
  | 'SWISS'
  | 'KNOCKOUTS'
  | 'PLAY_IN'
  | 'TIEBREAK'
  | 'THIRD_PLACE'

export interface UpcomingMatchTeam {
  teamId: string
  name: string
  playerNames: string[]
}

export interface FirstLegResult {
  homeGoals: number
  awayGoals: number
}

// Ítem de GET /tournaments/:id/matches: próximos partidos jugables. Todos los
// ítems devueltos son jugables en simultáneo (consolas distintas).
export interface UpcomingMatch {
  matchId: string
  legNumber: 1 | 2
  phase: MatchPhase
  roundLabel: string
  groupName?: string
  homeTeam: UpcomingMatchTeam
  awayTeam: UpcomingMatchTeam
  assignedConsole: ConsoleType
  allowsPenalties: boolean
  // Solo presente en legNumber 2.
  firstLegResult?: FirstLegResult
}

// Body de PATCH /tournaments/match/:matchId
export interface MatchResultPayload {
  homeGoals: number
  awayGoals: number
  penaltyWinnerTeamId?: string
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
