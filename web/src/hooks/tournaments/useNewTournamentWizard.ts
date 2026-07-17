import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { useConsolesQuery, useFormatRulesQuery, useMatchModesQuery } from '../utils/useUtilsQueries'
import { formatDate } from '../../utils/date.utils'
import { buildDrawAssignments, getUnassignedPlayers } from '../../utils/tournament.utils'
import type {
  AssignmentMethod,
  ConsoleCode,
  MatchModeCode,
  NewTournamentStep,
  NewTournamentWizardData,
  TournamentFormat,
} from '../../types/tournament.types'

const STORAGE_KEY = 'tornemaker:new-tournament-wizard'

// Redimensiona un array de strings a `length`, truncando o rellenando con
// strings vacíos según corresponda. Preserva los valores existentes.
function resizeStringArray(items: string[], length: number): string[] {
  if (length < 0) return []
  if (items.length === length) return items
  if (items.length > length) return items.slice(0, length)
  return [...items, ...Array<string>(length - items.length).fill('')]
}

function resizeConsoleArray(
  items: ConsoleCode[],
  length: number,
  defaultConsole: ConsoleCode,
): ConsoleCode[] {
  if (length < 0) return []
  if (items.length === length) return items
  if (items.length > length) return items.slice(0, length)
  return [...items, ...Array<ConsoleCode>(length - items.length).fill(defaultConsole)]
}

function buildDefaultData(defaultName: string): NewTournamentWizardData {
  return {
    step: 'format',
    format: null,
    name: defaultName,
    teamCount: null,
    groupCap: null,
    aiFill: false,
    twoLegged: null,
    thirdPlaceMatch: null,
    matchMode: null,
    consoleCount: null,
    consoles: [],
    teams: [],
    players: [],
    assignmentMethod: null,
    assignments: [],
  }
}

// Los datos persistidos de una versión anterior del wizard usaban `groupSize`
// (reemplazado por `groupCap`) y no tenían `aiFill`. En vez de migrar campo a
// campo, se descartan por completo: el input libre de `teamCount`/`groupCap`
// reemplaza la lógica de catálogo anterior y no hay forma segura de mapear un
// estado viejo al nuevo (fallback seguro: el usuario arranca el wizard de nuevo).
function isCurrentWizardShape(value: unknown): value is NewTournamentWizardData {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.aiFill === 'boolean' && 'groupCap' in candidate
}

function readStoredData(): NewTournamentWizardData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isCurrentWizardShape(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Maneja el estado completo del wizard de creación de torneo (datos + step +
// método de asignación), persistido en sessionStorage para sobrevivir un
// refresh de la página. Se borra explícitamente al finalizar el wizard (éxito
// o cancelación) y se pierde al cerrar la pestaña.
//
// Los catálogos dinámicos (consolas, modalidades, reglas de formato) se leen
// acá vía TanStack Query y alimentan los valores derivados (`perTeam`,
// `allowsAi`, `formatRules`) que consumen los distintos steps, igual que
// antes cuando salían de tablas hardcodeadas. La cantidad de equipos y el
// tope de grupo (SINGLE_ELIMINATION / GROUP_STAGE_PLUS_ELIMINATION) son
// inputs numéricos libres validados contra `formatRules.teamRange` /
// `formatRules.groupCap` en ParameterStep.container; LEAGUE y
// SWISS_PLUS_ELIMINATION siguen ofreciendo un Select armado a partir de
// `formatRules.teamRange` / `formatRules.teamCounts` respectivamente.
export function useNewTournamentWizard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [data, setData] = useState<NewTournamentWizardData>(() => {
    const stored = readStoredData()
    if (stored) return stored

    const userName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
    const defaultName = t('tournament.steps.parameters.name.defaultName', {
      userName,
      date: formatDate(new Date()),
    })
    return buildDefaultData(defaultName)
  })

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const clearWizard = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const consolesQuery = useConsolesQuery()
  const matchModesQuery = useMatchModesQuery()
  const formatRulesQuery = useFormatRulesQuery(data.format)

  const consoles = useMemo(() => consolesQuery.data ?? [], [consolesQuery.data])
  const matchModes = useMemo(() => matchModesQuery.data ?? [], [matchModesQuery.data])
  const formatRules = formatRulesQuery.data

  const defaultConsole: ConsoleCode = useMemo(
    () => consoles.find((item) => item.isDefault)?.code ?? consoles[0]?.code ?? '',
    [consoles],
  )

  const perTeamByMode = useMemo(() => {
    const map = new Map<string, number>()
    matchModes.forEach((mode) => map.set(mode.code, mode.playersPerTeam))
    return map
  }, [matchModes])

  const getPerTeamFor = useCallback(
    (matchMode: MatchModeCode | null) => (matchMode ? (perTeamByMode.get(matchMode) ?? 1) : 1),
    [perTeamByMode],
  )

  const setFormat = useCallback((format: TournamentFormat) => {
    setData((prev) => ({
      ...prev,
      format,
      // La cantidad de equipos / tope de grupo / relleno con IA válidos
      // dependen del nuevo formato (rango dinámico, ver useFormatRulesQuery),
      // así que se resetean acá: el usuario los vuelve a completar una vez
      // elegido el formato.
      teamCount: null,
      groupCap: null,
      aiFill: false,
      thirdPlaceMatch: format === 'LEAGUE' ? false : prev.thirdPlaceMatch,
    }))
  }, [])

  const setName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, name }))
  }, [])

  // `teamCount` ahora es un valor libre (Select cerrado solo para LEAGUE/
  // SWISS, ver ParameterStep.container): acá solo se persiste y se
  // redimensionan los arrays de equipos/jugadores en consecuencia. `null`
  // representa el input vacío mientras el usuario está tipeando.
  const setTeamCount = useCallback(
    (teamCount: number | null) => {
      setData((prev) => {
        const perTeam = getPerTeamFor(prev.matchMode)
        const resolvedCount = teamCount ?? 0
        return {
          ...prev,
          teamCount,
          teams: resizeStringArray(prev.teams, resolvedCount),
          players: resizeStringArray(prev.players, resolvedCount * perTeam),
        }
      })
    },
    [getPerTeamFor],
  )

  const setGroupCap = useCallback((groupCap: number | null) => {
    setData((prev) => ({ ...prev, groupCap }))
  }, [])

  const setAiFill = useCallback((aiFill: boolean) => {
    setData((prev) => ({ ...prev, aiFill }))
  }, [])

  const setTwoLegged = useCallback((twoLegged: boolean) => {
    setData((prev) => ({ ...prev, twoLegged }))
  }, [])

  const setThirdPlaceMatch = useCallback((thirdPlaceMatch: boolean) => {
    setData((prev) => ({ ...prev, thirdPlaceMatch }))
  }, [])

  const setMatchMode = useCallback(
    (matchMode: MatchModeCode) => {
      setData((prev) => {
        const perTeam = getPerTeamFor(matchMode)
        const teamCount = prev.teamCount ?? 0
        return { ...prev, matchMode, players: resizeStringArray(prev.players, teamCount * perTeam) }
      })
    },
    [getPerTeamFor],
  )

  const setConsoleCount = useCallback(
    (consoleCount: number) => {
      setData((prev) => ({
        ...prev,
        consoleCount,
        consoles: resizeConsoleArray(prev.consoles, consoleCount, defaultConsole),
      }))
    },
    [defaultConsole],
  )

  const setConsoleTypeAt = useCallback((index: number, type: ConsoleCode) => {
    setData((prev) => {
      const consoles = [...prev.consoles]
      consoles[index] = type
      return { ...prev, consoles }
    })
  }, [])

  const setTeamNameAt = useCallback((index: number, value: string) => {
    setData((prev) => {
      const teams = [...prev.teams]
      teams[index] = value
      return { ...prev, teams }
    })
  }, [])

  const setPlayerNameAt = useCallback((index: number, value: string) => {
    setData((prev) => {
      const players = [...prev.players]
      players[index] = value
      return { ...prev, players }
    })
  }, [])

  // Asigna los `perTeam` slots (algunos pueden quedar '' mientras el usuario
  // todavía está eligiendo) de un equipo puntual, usado por TeamPlayersStep.
  // Si todos los slots quedan vacíos, se elimina la entrada (equipo = IA).
  const setTeamAssignment = useCallback((teamIndex: number, players: string[]) => {
    setData((prev) => {
      const withoutTeam = prev.assignments.filter((assignment) => assignment.teamIndex !== teamIndex)
      const hasAnyFilled = players.some((player) => player.trim().length > 0)
      const assignments = hasAnyFilled ? [...withoutTeam, { teamIndex, players }] : withoutTeam
      return { ...prev, assignments }
    })
  }, [])

  // Resuelve el método de asignación elegido en el modal de PlayersStep:
  // - MANUAL: pasa al step de asignación manual (TeamPlayersStep).
  // - DRAW: resuelve el sorteo acá mismo y salta directo a Confirmation.
  const chooseAssignmentMethod = useCallback(
    (method: AssignmentMethod) => {
      setData((prev) => {
        if (method === 'DRAW') {
          const perTeam = getPerTeamFor(prev.matchMode)
          const assignments = buildDrawAssignments(prev.players, prev.teamCount ?? 0, perTeam)
          return { ...prev, assignmentMethod: method, assignments, step: 'confirmation' }
        }

        if (method === 'MANUAL') {
          return { ...prev, assignmentMethod: method, step: 'teamPlayers' }
        }

        // ROULETTE está deshabilitada (Próximamente): no debería poder elegirse.
        return prev
      })
    },
    [getPerTeamFor],
  )

  const goNext = useCallback(() => {
    setData((prev) => {
      let nextStep: NewTournamentStep = prev.step
      switch (prev.step) {
        case 'format':
          nextStep = 'parameters'
          break
        case 'parameters':
          nextStep = 'teams'
          break
        case 'teams':
          nextStep = 'players'
          break
        case 'teamPlayers':
          nextStep = 'confirmation'
          break
        default:
          break
      }
      return { ...prev, step: nextStep }
    })
  }, [])

  const goBack = useCallback(() => {
    setData((prev) => {
      let prevStep: NewTournamentStep = prev.step
      switch (prev.step) {
        case 'parameters':
          prevStep = 'format'
          break
        case 'teams':
          prevStep = 'parameters'
          break
        case 'players':
          prevStep = 'teams'
          break
        case 'teamPlayers':
          prevStep = 'players'
          break
        case 'confirmation':
          prevStep = prev.assignmentMethod === 'MANUAL' ? 'teamPlayers' : 'players'
          break
        default:
          break
      }
      return { ...prev, step: prevStep }
    })
  }, [])

  const perTeam = getPerTeamFor(data.matchMode)
  const allowsAi = formatRules?.allowsAi ?? false
  const unassignedPlayers = getUnassignedPlayers(data.players, data.assignments)

  return {
    data,
    perTeam,
    allowsAi,
    // Reglas crudas del formato elegido (rango de equipos / set cerrado /
    // tope de grupo), consumidas directamente por ParameterStep.container
    // para armar el input/Select correcto y las validaciones client-side.
    formatRules,
    unassignedPlayers,
    consoles,
    matchModes,
    defaultConsole,
    isLoadingConsoles: consolesQuery.isLoading,
    isLoadingMatchModes: matchModesQuery.isLoading,
    isLoadingFormatRules: formatRulesQuery.isLoading,
    setFormat,
    setName,
    setTeamCount,
    setGroupCap,
    setAiFill,
    setTwoLegged,
    setThirdPlaceMatch,
    setMatchMode,
    setConsoleCount,
    setConsoleTypeAt,
    setTeamNameAt,
    setPlayerNameAt,
    setTeamAssignment,
    chooseAssignmentMethod,
    goNext,
    goBack,
    clearWizard,
  }
}

export type NewTournamentWizard = ReturnType<typeof useNewTournamentWizard>
