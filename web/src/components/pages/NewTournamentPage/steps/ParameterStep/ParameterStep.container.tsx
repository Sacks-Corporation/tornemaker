import { useTranslation } from 'react-i18next'
import ParameterStep from './ParameterStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import type { SelectOption, RadioOption } from '../../../../../types/common.types'
import type { ConsoleCode, MatchModeCode } from '../../../../../types/tournament.types'

const CONSOLE_COUNT_OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1)

export interface ParameterStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function ParameterStepContainer({ wizard, currentStep, totalSteps }: ParameterStepContainerProps) {
  const { t } = useTranslation()
  const { data } = wizard

  const formatLabel = data.format ? t(`tournament.formats.${data.format}.title`) : ''
  const showGroupSize = data.format === 'GROUP_STAGE_PLUS_ELIMINATION'
  const showThirdPlaceMatch = data.format !== 'LEAGUE'

  const teamCountOptions: SelectOption[] = wizard.teamCountOptions.map((value) => ({
    value: String(value),
    label: String(value),
  }))

  const groupSizeOptions: SelectOption[] = wizard.groupSizeOptions.map((value) => ({
    value: String(value),
    label: String(value),
  }))

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
    (showGroupSize && data.groupSize === null) ||
    data.twoLegged === null ||
    (showThirdPlaceMatch && data.thirdPlaceMatch === null) ||
    data.matchMode === null ||
    data.consoleCount === null ||
    data.consoleCount < 1 ||
    data.consoles.length !== data.consoleCount ||
    data.consoles.some((consoleCode) => consoleCode === '') ||
    wizard.isLoadingFormatRules ||
    wizard.isLoadingConsoles

  return (
    <ParameterStep
      formatLabel={formatLabel}
      name={data.name}
      onNameChange={wizard.setName}
      teamCountOptions={teamCountOptions}
      teamCount={data.teamCount !== null ? String(data.teamCount) : null}
      onTeamCountChange={(value) => wizard.setTeamCount(Number(value))}
      isLoadingTeamCount={wizard.isLoadingFormatRules}
      showGroupSize={showGroupSize}
      groupSizeOptions={groupSizeOptions}
      groupSize={data.groupSize !== null ? String(data.groupSize) : null}
      onGroupSizeChange={(value) => wizard.setGroupSize(Number(value))}
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
