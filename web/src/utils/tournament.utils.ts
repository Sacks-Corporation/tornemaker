// Utilidades del dominio "tournaments": sorteo de equipos y armado del
// payload de creación de torneo. Las combinaciones válidas de parámetros
// (cantidades de equipos, tamaños de grupo, IA por formato, modalidades y
// consolas) ya no viven acá: son catálogos dinámicos que vienen del backend
// (ver web/src/hooks/utils/useUtilsQueries.ts).

import type {
  AssignmentMethod,
  CreateTournamentPayload,
  Match,
  MatchModeCode,
  MatchPhase,
  NewTournamentStep,
  NewTournamentWizardData,
  TeamAssignment,
  TournamentDetail,
  TournamentFormat,
  TournamentTeam,
  UpcomingMatch,
} from '../types/tournament.types'

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

// Formatos que reemplazan el Select cerrado de "cantidad de equipos" por un
// input numérico libre, muestran "Tope de equipos por grupo" (solo
// GROUP_STAGE_PLUS_ELIMINATION) y pueden ofrecer el switch de relleno con IA.
// LEAGUE y SWISS_PLUS_ELIMINATION quedan fuera de alcance de este cambio.
export const FREE_TEAM_COUNT_FORMATS: readonly TournamentFormat[] = [
  'SINGLE_ELIMINATION',
  'GROUP_STAGE_PLUS_ELIMINATION',
]

export const usesFreeTeamCountInput = (format: TournamentFormat | null): boolean =>
  format !== null && FREE_TEAM_COUNT_FORMATS.includes(format)

// Arma el body de POST /tournaments a partir del estado persistido del wizard.
// Asume que el estado ya fue validado (todos los campos requeridos completos).
export const buildTournamentPayload = (
  wizard: NewTournamentWizardData,
): CreateTournamentPayload => {
  const format = wizard.format as TournamentFormat
  const includesGroupCap = format === 'GROUP_STAGE_PLUS_ELIMINATION'
  const includesAiFill = usesFreeTeamCountInput(format)

  return {
    name: wizard.name.trim(),
    format,
    teamCount: wizard.teamCount as number,
    matchMode: wizard.matchMode as MatchModeCode,
    twoLegged: wizard.twoLegged ?? false,
    thirdPlaceMatch: format === 'LEAGUE' ? false : (wizard.thirdPlaceMatch ?? false),
    ...(includesGroupCap ? { groupCap: wizard.groupCap as number } : {}),
    ...(includesAiFill ? { aiFill: wizard.aiFill } : {}),
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
// Preview de configuración para ParameterStep (réplica en el front del
// cálculo que hace la API en `dto/format-rules.ts`, SOLO para render — la
// API vuelve a calcular y valida todo del lado del servidor). Genérico por
// rangos, sin tablas hardcodeadas por valor puntual.

// Menor potencia de 2 >= n.
export const nextPowerOfTwo = (n: number): number => {
  let power = 1
  while (power < n) power *= 2
  return power
}

export interface EliminationPreview {
  drawSize: number
  hasPreliminaryRound: boolean
  // Equipos que juegan la ronda preliminar (siempre un número par).
  preliminaryTeamCount: number
  // Equipos que pasan directo a la siguiente ronda (byes).
  byeCount: number
}

// Réplica del armado de cuadro de SINGLE_ELIMINATION: si `teamCount` no es
// potencia de 2, arma una ronda preliminar + byes hasta la próxima potencia
// de 2 (drawSize). Ej: N=15 -> drawSize=16, 14 juegan preliminar, 1 bye.
export const computeEliminationPreview = (teamCount: number): EliminationPreview => {
  const drawSize = nextPowerOfTwo(teamCount)
  const hasPreliminaryRound = drawSize !== teamCount

  if (!hasPreliminaryRound) {
    return { drawSize, hasPreliminaryRound, preliminaryTeamCount: 0, byeCount: 0 }
  }

  const halfDraw = drawSize / 2
  const preliminaryTeamCount = 2 * (teamCount - halfDraw)
  const byeCount = halfDraw - (teamCount - halfDraw)
  return { drawSize, hasPreliminaryRound, preliminaryTeamCount, byeCount }
}

// Cantidad total de equipos (reales + IA) para SINGLE_ELIMINATION cuando
// `aiFill` está activo: la próxima potencia de 2 >= `realCount`, sin superar
// el máximo del formato.
export const computeEliminationAiFillTeamCount = (realCount: number, maxTeams: number): number =>
  Math.min(nextPowerOfTwo(realCount), maxTeams)

export type GroupDistributionPreview =
  | { valid: true; groupCount: number; groupSizes: number[] }
  | { valid: false }

// Réplica de `computeGroupDistribution` de la API: distribución balanceada de
// `teamCount` equipos en grupos de a lo sumo `groupCap` equipos cada uno.
// Válida solo si `groupCount >= 2` y `teamCount >= 3 * groupCount`.
export const computeGroupDistributionPreview = (
  teamCount: number,
  groupCap: number,
): GroupDistributionPreview => {
  if (!Number.isInteger(teamCount) || !Number.isInteger(groupCap) || teamCount <= 0 || groupCap <= 0) {
    return { valid: false }
  }

  const groupCount = Math.ceil(teamCount / groupCap)
  if (groupCount < 2 || teamCount < 3 * groupCount) {
    return { valid: false }
  }

  const base = Math.floor(teamCount / groupCount)
  const remainder = teamCount % groupCount
  const groupSizes = [
    ...Array<number>(remainder).fill(base + 1),
    ...Array<number>(groupCount - remainder).fill(base),
  ]

  return { valid: true, groupCount, groupSizes }
}

// Cantidad total de equipos (reales + IA) para GROUP_STAGE_PLUS_ELIMINATION
// cuando `aiFill` está activo: la próxima múltiplo de `groupCap` >=
// `realCount`, sin superar el máximo del formato.
export const computeGroupStageAiFillTeamCount = (
  realCount: number,
  groupCap: number,
  maxTeams: number,
): number => {
  const nextMultiple = Math.ceil(realCount / groupCap) * groupCap
  return Math.min(nextMultiple, maxTeams)
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

// Lookup code -> label sobre un catálogo dinámico (consolas, modalidades).
// Si el code ya no existe en el catálogo (por ejemplo, un torneo viejo con
// una consola/modalidad dada de baja) se muestra el code crudo como fallback.
export const getCatalogLabel = (
  items: Array<{ code: string; label: string }>,
  code: string | null | undefined,
): string => {
  if (!code) return ''
  return items.find((item) => item.code === code)?.label ?? code
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
