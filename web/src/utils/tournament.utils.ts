// Utilidades del dominio "tournaments": combinaciones válidas de parámetros,
// derivadas del formato/modalidad, sorteo de equipos y armado del payload de
// creación de torneo.

import type {
  AssignmentMethod,
  ConsoleType,
  CreateTournamentPayload,
  Match,
  MatchMode,
  MatchPhase,
  NewTournamentStep,
  NewTournamentWizardData,
  TeamAssignment,
  TournamentDetail,
  TournamentFormat,
  TournamentTeam,
  UpcomingMatch,
} from '../types/tournament.types'

// Cantidades de equipos válidas por formato.
export const TEAM_COUNT_OPTIONS_BY_FORMAT: Record<TournamentFormat, number[]> = {
  SINGLE_ELIMINATION: [6, 8, 10, 12, 16, 20, 24, 28, 32],
  GROUP_STAGE_PLUS_ELIMINATION: [6, 8, 12, 16, 20, 24, 28, 32],
  LEAGUE: Array.from({ length: 27 }, (_, index) => index + 4), // 4..30
  SWISS_PLUS_ELIMINATION: [8, 10, 12, 16, 24, 32],
}

// Tamaños de grupo válidos según la cantidad de equipos, solo aplica a
// GROUP_STAGE_PLUS_ELIMINATION.
export const GROUP_SIZE_OPTIONS_BY_TEAM_COUNT: Record<number, number[]> = {
  6: [3],
  8: [4],
  12: [3, 4],
  16: [4],
  20: [5],
  24: [3, 4],
  28: [4],
  32: [4],
}

export const PER_TEAM_BY_MATCH_MODE: Record<MatchMode, number> = {
  '1v1': 1,
  '2v2': 2,
  '3v3': 3,
}

// Formatos donde los equipos sin jugadores asignados quedan controlados por IA.
export const AI_ALLOWED_FORMATS: TournamentFormat[] = [
  'SINGLE_ELIMINATION',
  'GROUP_STAGE_PLUS_ELIMINATION',
]

export const formatAllowsAi = (format: TournamentFormat | null): boolean =>
  format !== null && AI_ALLOWED_FORMATS.includes(format)

export const getTeamCountOptions = (format: TournamentFormat | null): number[] =>
  format ? TEAM_COUNT_OPTIONS_BY_FORMAT[format] : []

export const getGroupSizeOptions = (teamCount: number | null): number[] =>
  teamCount !== null ? (GROUP_SIZE_OPTIONS_BY_TEAM_COUNT[teamCount] ?? []) : []

export const getPerTeam = (matchMode: MatchMode | null): number =>
  matchMode ? PER_TEAM_BY_MATCH_MODE[matchMode] : 1

// Devuelve una lista con los nombres cargados, sin espacios sobrantes ni vacíos.
export const getFilledNames = (names: string[]): string[] =>
  names.map((name) => name.trim()).filter((name) => name.length > 0)

export const hasDuplicateNames = (names: string[]): boolean => {
  const normalized = names
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0)
  return new Set(normalized).size !== normalized.length
}

// Fisher-Yates shuffle, no muta el array original.
export const shuffleArray = <T>(items: T[]): T[] => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Arma los equipos a partir de los jugadores cargados: los agrupa en chunks
// de `perTeam` (al azar) y los asigna a índices de equipo elegidos al azar.
// Si hay menos jugadores que equipos, los equipos restantes quedan sin
// asignación (controlados por IA) cuando el formato lo permite.
export const buildDrawAssignments = (
  players: string[],
  teamCount: number,
  perTeam: number,
): TeamAssignment[] => {
  const filledPlayers = getFilledNames(players)
  const shuffledPlayers = shuffleArray(filledPlayers)

  const chunks: string[][] = []
  for (let i = 0; i + perTeam <= shuffledPlayers.length; i += perTeam) {
    chunks.push(shuffledPlayers.slice(i, i + perTeam))
  }

  const shuffledTeamIndexes = shuffleArray(Array.from({ length: teamCount }, (_, index) => index))

  return chunks.map((chunkPlayers, index) => ({
    teamIndex: shuffledTeamIndexes[index],
    players: chunkPlayers,
  }))
}

// Jugadores cargados que todavía no fueron asignados a ningún equipo.
export const getUnassignedPlayers = (
  players: string[],
  assignments: TeamAssignment[],
): string[] => {
  const assignedPlayers = new Set(
    assignments.flatMap((assignment) => getFilledNames(assignment.players)),
  )
  return getFilledNames(players).filter((player) => !assignedPlayers.has(player))
}

// Devuelve los `perTeam` slots (jugador o '' si el slot está vacío) de un
// equipo puntual, usado por TeamPlayersStep para renderizar sus selects.
export const getTeamSlots = (
  assignments: TeamAssignment[],
  teamIndex: number,
  perTeam: number,
): string[] => {
  const assignment = assignments.find((item) => item.teamIndex === teamIndex)
  const players = assignment?.players ?? []
  return Array.from({ length: perTeam }, (_, index) => players[index] ?? '')
}

// Valida que la asignación manual esté completa: cada equipo tiene 0 o
// exactamente `perTeam` jugadores (0 solo permitido si el formato admite IA),
// y todos los jugadores cargados quedaron asignados a algún equipo.
export const isTeamPlayersStepValid = (
  teamCount: number,
  perTeam: number,
  assignments: TeamAssignment[],
  allowsAi: boolean,
  totalFilledPlayers: number,
): boolean => {
  let assignedCount = 0

  for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
    const filled = getFilledNames(getTeamSlots(assignments, teamIndex, perTeam))
    if (filled.length !== 0 && filled.length !== perTeam) return false
    if (filled.length === 0 && !allowsAi) return false
    assignedCount += filled.length
  }

  return assignedCount === totalFilledPlayers
}

// Orden canónico de steps del wizard. `teamPlayers` solo se visita cuando el
// método de asignación elegido es manual.
export const WIZARD_STEP_ORDER: NewTournamentStep[] = [
  'format',
  'parameters',
  'teams',
  'players',
  'teamPlayers',
  'confirmation',
]

export const getVisibleWizardSteps = (
  assignmentMethod: AssignmentMethod | null,
): NewTournamentStep[] =>
  assignmentMethod === 'MANUAL'
    ? WIZARD_STEP_ORDER
    : WIZARD_STEP_ORDER.filter((step) => step !== 'teamPlayers')

// Calcula el número de paso (1-based) y el total de pasos visibles, para
// alimentar al indicador de progreso de <StepsLayout>.
export const getWizardStepMeta = (
  step: NewTournamentStep,
  assignmentMethod: AssignmentMethod | null,
): { currentStep: number; totalSteps: number } => {
  const visibleSteps = getVisibleWizardSteps(assignmentMethod)
  const index = visibleSteps.indexOf(step)
  return { currentStep: index >= 0 ? index + 1 : 1, totalSteps: visibleSteps.length }
}

export const DEFAULT_CONSOLE_TYPE: ConsoleType = 'PLAY_4'

// Arma el body de POST /tournaments a partir del estado persistido del wizard.
// Asume que el estado ya fue validado (todos los campos requeridos completos).
export const buildTournamentPayload = (
  wizard: NewTournamentWizardData,
): CreateTournamentPayload => {
  const format = wizard.format as TournamentFormat
  const includesGroupSize = format === 'GROUP_STAGE_PLUS_ELIMINATION'

  return {
    name: wizard.name.trim(),
    format,
    teamCount: wizard.teamCount as number,
    matchMode: wizard.matchMode as MatchMode,
    twoLegged: wizard.twoLegged ?? false,
    thirdPlaceMatch: format === 'LEAGUE' ? false : (wizard.thirdPlaceMatch ?? false),
    ...(includesGroupSize ? { groupSize: wizard.groupSize as number } : {}),
    consoles: wizard.consoles,
    teams: wizard.teams.map((team) => team.trim()),
    players: getFilledNames(wizard.players),
    assignments: wizard.assignments
      .map((assignment) => ({
        teamIndex: assignment.teamIndex,
        players: getFilledNames(assignment.players),
      }))
      .filter((assignment) => assignment.players.length > 0),
  }
}

// --------------------------------------------------------------------------
// Helpers de presentación para la visualización del torneo y la carga de
// resultados. Ninguno de estos calcula lógica de torneo (posiciones, avance,
// clasificados): son lookups de datos ya devueltos por el back o cálculos
// sobre el formulario de carga (conveniencia visual, el back valida igual).

// Lookup de equipo por id, armado a partir de `teams` del torneo. Se usa para
// resolver nombres/jugadores en toda la pantalla (no es "calcular", es lookup
// de presentación).
export const buildTeamMap = (teams: TournamentTeam[]): Map<string, TournamentTeam> =>
  new Map(teams.map((team) => [team.teamId, team]))

export const getTeamName = (
  teamMap: Map<string, TournamentTeam>,
  teamId: string | undefined,
  placeholder: string,
): string => {
  if (!teamId) return placeholder
  return teamMap.get(teamId)?.name ?? placeholder
}

export const getTeamPlayerNames = (
  teamMap: Map<string, TournamentTeam>,
  teamId: string | undefined,
): string[] => {
  if (!teamId) return []
  return teamMap.get(teamId)?.playerNames ?? []
}

// Determina si el resultado ingresado en el modal de carga está empatado y
// por lo tanto habilita el selector de penales (solo si `allowsPenalties`).
// legNumber 1 -> empate simple. legNumber 2 -> empate en el global ida+vuelta.
export const isTiedResult = (
  match: Pick<UpcomingMatch, 'legNumber' | 'firstLegResult'>,
  homeGoals: number,
  awayGoals: number,
): boolean => {
  if (match.legNumber === 2 && match.firstLegResult) {
    const aggregateHome = match.firstLegResult.homeGoals + homeGoals
    const aggregateAway = match.firstLegResult.awayGoals + awayGoals
    return aggregateHome === aggregateAway
  }
  return homeGoals === awayGoals
}

// Global ida+vuelta a mostrar en el modal como conveniencia visual (única
// suma permitida en el front; el back valida el resultado igual).
export const getAggregateScore = (
  firstLegResult: { homeGoals: number; awayGoals: number } | undefined,
  homeGoals: number,
  awayGoals: number,
): { homeGoals: number; awayGoals: number } | null => {
  if (!firstLegResult) return null
  return {
    homeGoals: firstLegResult.homeGoals + homeGoals,
    awayGoals: firstLegResult.awayGoals + awayGoals,
  }
}

// Formatea el marcador de un partido ya jugado (uno o más legs). Es
// formateo de texto puro, no cálculo de lógica de torneo.
export const formatMatchScoreLabel = (match: Pick<Match, 'legs' | 'status'>): string => {
  if (match.status === 'SCHEDULED' || match.legs.length === 0) return '-'
  return match.legs.map((leg) => `${leg.homeGoals}-${leg.awayGoals}`).join(' / ')
}

// Lookup del flag "ida y vuelta" de la fase a la que pertenece un próximo
// partido (para decidir si corresponde mostrar la etiqueta "Ida" en el
// legNumber 1; en legNumber 2 siempre corresponde "Vuelta"). Lee un flag ya
// provisto por el back, no calcula nada del torneo.
export const isTwoLeggedPhase = (tournament: TournamentDetail, phase: MatchPhase): boolean => {
  switch (phase) {
    case 'LEAGUE':
      return tournament.leagueStage?.doubleRound ?? false
    case 'GROUPS':
      return tournament.groupStage?.doubleRound ?? false
    case 'KNOCKOUTS':
    case 'THIRD_PLACE':
      return tournament.knockoutStage?.bracket.isTwoLegged ?? false
    default:
      return false
  }
}
