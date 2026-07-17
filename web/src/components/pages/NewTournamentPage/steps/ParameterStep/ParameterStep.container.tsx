import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ParameterStep from './ParameterStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import type { SelectOption, RadioOption } from '../../../../../types/common.types'
import type { ConsoleCode, MatchModeCode } from '../../../../../types/tournament.types'
import {
  computeEliminationAiFillTeamCount,
  computeEliminationPreview,
  computeGroupDistributionPreview,
  computeGroupStageAiFillTeamCount,
  usesFreeTeamCountInput,
} from '../../../../../utils/tournament.utils'

const CONSOLE_COUNT_OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1)
const DEFAULT_GROUP_CAP_MIN = 3

export interface ParameterStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function ParameterStepContainer({ wizard, currentStep, totalSteps }: ParameterStepContainerProps) {
  const { t } = useTranslation()
  const { data, formatRules } = wizard

  const formatLabel = data.format ? t(`tournament.formats.${data.format}.title`) : ''
  const useTeamCountInput = usesFreeTeamCountInput(data.format)
  const showGroupCap = data.format === 'GROUP_STAGE_PLUS_ELIMINATION'
  const showThirdPlaceMatch = data.format !== 'LEAGUE'
  // `allowsAi` (GET /utils/tournament-formats) es el mismo flag que ya
  // gobierna si los equipos sin jugadores asignados quedan controlados por
  // IA (TeamsStep/PlayersStep): coincide exactamente con los dos formatos
  // alcanzados por este cambio (SINGLE_ELIMINATION, GROUP_STAGE_PLUS_ELIMINATION).
  const showAiFill = useTeamCountInput && wizard.allowsAi

  const teamCountRange = formatRules?.teamRange
  const groupCapMin = formatRules?.groupCap?.min ?? DEFAULT_GROUP_CAP_MIN
  const maxTeams = teamCountRange?.max

  // --- Cantidad de equipos: Select cerrado, solo LEAGUE / SWISS_PLUS_ELIMINATION ---
  const teamCountOptions: SelectOption[] = useMemo(() => {
    if (useTeamCountInput || !formatRules) return []

    const values =
      formatRules.teamCounts ??
      (formatRules.teamRange
        ? Array.from(
            { length: formatRules.teamRange.max - formatRules.teamRange.min + 1 },
            (_, index) => (formatRules.teamRange as { min: number; max: number }).min + index,
          )
        : [])

    return values.map((value) => ({ value: String(value), label: String(value) }))
  }, [useTeamCountInput, formatRules])

  // --- Validaciones client-side (réplica del contrato de la API) ---------
  const teamCountError = useMemo(() => {
    if (!useTeamCountInput || data.teamCount === null || !teamCountRange) return null
    if (
      !Number.isInteger(data.teamCount) ||
      data.teamCount < teamCountRange.min ||
      data.teamCount > teamCountRange.max
    ) {
      return t('tournament.steps.parameters.teamCount.errors.range', teamCountRange)
    }
    return null
  }, [useTeamCountInput, data.teamCount, teamCountRange, t])

  const groupDistribution = useMemo(() => {
    if (!showGroupCap || data.teamCount === null || data.groupCap === null) return null
    return computeGroupDistributionPreview(data.teamCount, data.groupCap)
  }, [showGroupCap, data.teamCount, data.groupCap])

  const groupCapError = useMemo(() => {
    if (!showGroupCap || data.groupCap === null) return null
    if (!Number.isInteger(data.groupCap) || data.groupCap < groupCapMin) {
      return t('tournament.steps.parameters.groupCap.errors.min', { min: groupCapMin })
    }
    if (!teamCountError && groupDistribution && !groupDistribution.valid) {
      return t('tournament.steps.parameters.groupCap.errors.invalidCombination')
    }
    return null
  }, [showGroupCap, data.groupCap, groupCapMin, teamCountError, groupDistribution, t])

  // --- Preview de configuración -------------------------------------------
  const previewLines: string[] = useMemo(() => {
    if (!useTeamCountInput || data.teamCount === null || teamCountError) return []

    const lines: string[] = []
    const teamCount = data.teamCount

    if (data.format === 'SINGLE_ELIMINATION') {
      const preview = computeEliminationPreview(teamCount)
      if (preview.hasPreliminaryRound) {
        lines.push(
          t('tournament.steps.parameters.preview.preliminaryRound', {
            count: preview.preliminaryTeamCount,
          }),
        )
        lines.push(
          preview.byeCount === 1
            ? t('tournament.steps.parameters.preview.byeSingular')
            : t('tournament.steps.parameters.preview.byePlural', { count: preview.byeCount }),
        )
      }

      if (data.aiFill && maxTeams !== undefined) {
        const target = computeEliminationAiFillTeamCount(teamCount, maxTeams)
        if (target > teamCount) {
          lines.push(
            t('tournament.steps.parameters.preview.aiFill', {
              count: target - teamCount,
              total: target,
            }),
          )
        }
      }

      return lines
    }

    if (data.format === 'GROUP_STAGE_PLUS_ELIMINATION' && data.groupCap !== null && !groupCapError) {
      const groupCap = data.groupCap

      if (data.aiFill && maxTeams !== undefined) {
        const target = computeGroupStageAiFillTeamCount(teamCount, groupCap, maxTeams)
        const distribution = computeGroupDistributionPreview(target, groupCap)
        if (distribution.valid) {
          lines.push(
            t('tournament.steps.parameters.preview.groups', {
              count: distribution.groupCount,
              sizes: distribution.groupSizes.join(', '),
            }),
          )
          if (target > teamCount) {
            lines.push(
              t('tournament.steps.parameters.preview.aiFill', {
                count: target - teamCount,
                total: target,
              }),
            )
          }
          return lines
        }
      }

      if (groupDistribution?.valid) {
        lines.push(
          t('tournament.steps.parameters.preview.groups', {
            count: groupDistribution.groupCount,
            sizes: groupDistribution.groupSizes.join(', '),
          }),
        )
      }
    }

    return lines
  }, [
    useTeamCountInput,
    data.teamCount,
    data.format,
    data.aiFill,
    data.groupCap,
    teamCountError,
    groupCapError,
    groupDistribution,
    maxTeams,
    t,
  ])

  const yesNoOptions: RadioOption[] = [
    { value: 'yes', label: t('tournament.yesNo.yes') },
    { value: 'no', label: t('tournament.yesNo.no') },
  ]

  // Las opciones de modalidad y de tipo de consola salen del catálogo
  // dinámico (label ya resuelto por el back), no de i18n.
  const matchModeOptions: RadioOption<MatchModeCode>[] = wizard.matchModes.map((mode) => ({
    value: mode.code,
    label: mode.label,
  }))

  const consoleCountOptions: SelectOption[] = CONSOLE_COUNT_OPTIONS.map((value) => ({
    value: String(value),
    label: String(value),
  }))

  const consoleTypeOptions: SelectOption<ConsoleCode>[] = wizard.consoles.map((item) => ({
    value: item.code,
    label: item.label,
  }))

  const nextDisabled =
    data.name.trim() === '' ||
    data.teamCount === null ||
    Boolean(teamCountError) ||
    (showGroupCap && (data.groupCap === null || Boolean(groupCapError))) ||
    data.twoLegged === null ||
    (showThirdPlaceMatch && data.thirdPlaceMatch === null) ||
    data.matchMode === null ||
    data.consoleCount === null ||
    data.consoleCount < 1 ||
    data.consoles.length !== data.consoleCount ||
    data.consoles.some((consoleCode) => consoleCode === '') ||
    wizard.isLoadingFormatRules ||
    wizard.isLoadingConsoles

  const parseNumberField = (value: string): number | null => {
    if (value.trim() === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return (
    <ParameterStep
      formatLabel={formatLabel}
      name={data.name}
      onNameChange={wizard.setName}
      useTeamCountInput={useTeamCountInput}
      teamCountValue={data.teamCount !== null ? String(data.teamCount) : ''}
      onTeamCountValueChange={(value) => wizard.setTeamCount(parseNumberField(value))}
      teamCountMin={teamCountRange?.min}
      teamCountMax={teamCountRange?.max}
      teamCountError={teamCountError}
      teamCountOptions={teamCountOptions}
      teamCount={data.teamCount !== null ? String(data.teamCount) : null}
      onTeamCountChange={(value) => wizard.setTeamCount(Number(value))}
      isLoadingTeamCount={wizard.isLoadingFormatRules}
      showGroupCap={showGroupCap}
      groupCapValue={data.groupCap !== null ? String(data.groupCap) : ''}
      onGroupCapValueChange={(value) => wizard.setGroupCap(parseNumberField(value))}
      groupCapMin={groupCapMin}
      groupCapError={groupCapError}
      showAiFill={showAiFill}
      aiFill={data.aiFill}
      onAiFillChange={wizard.setAiFill}
      previewLines={previewLines}
      yesNoOptions={yesNoOptions}
      twoLegged={data.twoLegged === null ? null : data.twoLegged ? 'yes' : 'no'}
      onTwoLeggedChange={(value) => wizard.setTwoLegged(value === 'yes')}
      showThirdPlaceMatch={showThirdPlaceMatch}
      thirdPlaceMatch={data.thirdPlaceMatch === null ? null : data.thirdPlaceMatch ? 'yes' : 'no'}
      onThirdPlaceMatchChange={(value) => wizard.setThirdPlaceMatch(value === 'yes')}
      matchModeOptions={matchModeOptions}
      matchMode={data.matchMode}
      onMatchModeChange={wizard.setMatchMode}
      isLoadingMatchMode={wizard.isLoadingMatchModes}
      consoleCountOptions={consoleCountOptions}
      consoleCount={data.consoleCount !== null ? String(data.consoleCount) : null}
      onConsoleCountChange={(value) => wizard.setConsoleCount(Number(value))}
      consoles={data.consoles}
      consoleTypeOptions={consoleTypeOptions}
      onConsoleTypeChange={wizard.setConsoleTypeAt}
      isLoadingConsoleType={wizard.isLoadingConsoles}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={wizard.goBack}
      onNext={wizard.goNext}
      nextDisabled={nextDisabled}
    />
  )
}

export default ParameterStepContainer
