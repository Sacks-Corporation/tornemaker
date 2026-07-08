import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { formatDate } from '../../utils/date.utils'
import {
  DEFAULT_CONSOLE_TYPE,
  buildDrawAssignments,
  formatAllowsAi,
  getGroupSizeOptions,
  getPerTeam,
  getTeamCountOptions,
  getUnassignedPlayers,
} from '../../utils/tournament.utils'
import type {
  AssignmentMethod,
  ConsoleType,
  MatchMode,
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

function resizeConsoleArray(items: ConsoleType[], length: number): ConsoleType[] {
  if (length < 0) return []
  if (items.length === length) return items
  if (items.length > length) return items.slice(0, length)
  return [...items, ...Array<ConsoleType>(length - items.length).fill(DEFAULT_CONSOLE_TYPE)]
}

function buildDefaultData(defaultName: string): NewTournamentWizardData {
  return {
    step: 'format',
    format: null,
    name: defaultName,
    teamCount: null,
    groupSize: null,
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

function readStoredData(): NewTournamentWizardData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as NewTournamentWizardData
  } catch {
    return null
  }
}

// Maneja el estado completo del wizard de creación de torneo (datos + step +
// método de asignación), persistido en sessionStorage para sobrevivir un
// refresh de la página. Se borra explícitamente al finalizar el wizard (éxito
// o cancelación) y se pierde al cerrar la pestaña.
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

  const setFormat = useCallback((format: TournamentFormat) => {
    setData((prev) => {
      const teamCountOptions = getTeamCountOptions(format)
      const teamCount =
        prev.teamCount !== null && teamCountOptions.includes(prev.teamCount)
          ? prev.teamCount
          : null

      const isGroupStage = format === 'GROUP_STAGE_PLUS_ELIMINATION'
      const groupSizeOptions = isGroupStage ? getGroupSizeOptions(teamCount) : []
      const groupSize = isGroupStage
        ? (groupSizeOptions.length === 1
            ? groupSizeOptions[0]
            : prev.groupSize !== null && groupSizeOptions.includes(prev.groupSize)
              ? prev.groupSize
              : null)
        : null

      return {
        ...prev,
        format,
        teamCount,
        groupSize,
        thirdPlaceMatch: format === 'LEAGUE' ? false : prev.thirdPlaceMatch,
      }
    })
  }, [])

  const setName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, name }))
  }, [])

  const setTeamCount = useCallback((teamCount: number) => {
    setData((prev) => {
      const perTeam = getPerTeam(prev.matchMode)
      const isGroupStage = prev.format === 'GROUP_STAGE_PLUS_ELIMINATION'
      const groupSizeOptions = isGroupStage ? getGroupSizeOptions(teamCount) : []
      const groupSize = isGroupStage
        ? (groupSizeOptions.length === 1
            ? groupSizeOptions[0]
            : prev.groupSize !== null && groupSizeOptions.includes(prev.groupSize)
              ? prev.groupSize
              : null)
        : null

      return {
        ...prev,
        teamCount,
        groupSize,
        teams: resizeStringArray(prev.teams, teamCount),
        players: resizeStringArray(prev.players, teamCount * perTeam),
      }
    })
  }, [])

  const setGroupSize = useCallback((groupSize: number) => {
    setData((prev) => ({ ...prev, groupSize }))
  }, [])

  const setTwoLegged = useCallback((twoLegged: boolean) => {
    setData((prev) => ({ ...prev, twoLegged }))
  }, [])

  const setThirdPlaceMatch = useCallback((thirdPlaceMatch: boolean) => {
    setData((prev) => ({ ...prev, thirdPlaceMatch }))
  }, [])

  const setMatchMode = useCallback((matchMode: MatchMode) => {
    setData((prev) => {
      const perTeam = getPerTeam(matchMode)
      const teamCount = prev.teamCount ?? 0
      return { ...prev, matchMode, players: resizeStringArray(prev.players, teamCount * perTeam) }
    })
  }, [])

  const setConsoleCount = useCallback((consoleCount: number) => {
    setData((prev) => ({
      ...prev,
      consoleCount,
      consoles: resizeConsoleArray(prev.consoles, consoleCount),
    }))
  }, [])

  const setConsoleTypeAt = useCallback((index: number, type: ConsoleType) => {
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
  const chooseAssignmentMethod = useCallback((method: AssignmentMethod) => {
    setData((prev) => {
      if (method === 'DRAW') {
        const perTeam = getPerTeam(prev.matchMode)
        const assignments = buildDrawAssignments(prev.players, prev.teamCount ?? 0, perTeam)
        return { ...prev, assignmentMethod: method, assignments, step: 'confirmation' }
      }

      if (method === 'MANUAL') {
        return { ...prev, assignmentMethod: method, step: 'teamPlayers' }
      }

      // ROULETTE está deshabilitada (Próximamente): no debería poder elegirse.
      return prev
    })
  }, [])

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

  const perTeam = getPerTeam(data.matchMode)
  const allowsAi = formatAllowsAi(data.format)
  const teamCountOptions = getTeamCountOptions(data.format)
  const groupSizeOptions = getGroupSizeOptions(data.teamCount)
  const unassignedPlayers = getUnassignedPlayers(data.players, data.assignments)

  return {
    data,
    perTeam,
    allowsAi,
    teamCountOptions,
    groupSizeOptions,
    unassignedPlayers,
    setFormat,
    setName,
    setTeamCount,
    setGroupSize,
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
