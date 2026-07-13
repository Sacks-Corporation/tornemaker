import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import TextInput from '../../../../common/TextInput'
import Select from '../../../../common/Select'
import RadioGroup from '../../../../common/RadioGroup'
import type { SelectOption, RadioOption } from '../../../../../types/common.types'
import type { ConsoleCode, MatchModeCode } from '../../../../../types/tournament.types'

export interface ParameterStepProps {
  formatLabel: string
  name: string
  onNameChange: (value: string) => void
  teamCountOptions: SelectOption[]
  teamCount: string | null
  onTeamCountChange: (value: string) => void
  isLoadingTeamCount: boolean
  showGroupSize: boolean
  groupSizeOptions: SelectOption[]
  groupSize: string | null
  onGroupSizeChange: (value: string) => void
  yesNoOptions: RadioOption[]
  twoLegged: string | null
  onTwoLeggedChange: (value: string) => void
  showThirdPlaceMatch: boolean
  thirdPlaceMatch: string | null
  onThirdPlaceMatchChange: (value: string) => void
  matchModeOptions: RadioOption<MatchModeCode>[]
  matchMode: MatchModeCode | null
  onMatchModeChange: (value: MatchModeCode) => void
  isLoadingMatchMode: boolean
  consoleCountOptions: SelectOption[]
  consoleCount: string | null
  onConsoleCountChange: (value: string) => void
  consoles: ConsoleCode[]
  consoleTypeOptions: SelectOption<ConsoleCode>[]
  onConsoleTypeChange: (index: number, value: ConsoleCode) => void
  isLoadingConsoleType: boolean
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  nextDisabled: boolean
}

function ParameterStep({
  formatLabel,
  name,
  onNameChange,
  teamCountOptions,
  teamCount,
  onTeamCountChange,
  isLoadingTeamCount,
  showGroupSize,
  groupSizeOptions,
  groupSize,
  onGroupSizeChange,
  yesNoOptions,
  twoLegged,
  onTwoLeggedChange,
  showThirdPlaceMatch,
  thirdPlaceMatch,
  onThirdPlaceMatchChange,
  matchModeOptions,
  matchMode,
  onMatchModeChange,
  isLoadingMatchMode,
  consoleCountOptions,
  consoleCount,
  onConsoleCountChange,
  consoles,
  consoleTypeOptions,
  onConsoleTypeChange,
  isLoadingConsoleType,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextDisabled,
}: ParameterStepProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('tournament.steps.parameters.title')}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={nextDisabled}
    >
      <p className="text-sm font-medium text-primary">
        {t('tournament.steps.parameters.selectedFormatLabel')}: {formatLabel}
      </p>

      <TextInput
        label={t('tournament.steps.parameters.name.label')}
        placeholder={t('tournament.steps.parameters.name.placeholder')}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label={t('tournament.steps.parameters.teamCount.label')}
          placeholder={t('tournament.steps.parameters.teamCount.placeholder')}
          options={teamCountOptions}
          value={teamCount}
          onChange={onTeamCountChange}
          isLoading={isLoadingTeamCount}
          loadingLabel={t('tournament.steps.parameters.teamCount.loadingLabel')}
        />

        {showGroupSize && (
          <Select
            label={t('tournament.steps.parameters.groupSize.label')}
            placeholder={t('tournament.steps.parameters.groupSize.placeholder')}
            options={groupSizeOptions}
            value={groupSize}
            onChange={onGroupSizeChange}
            isLoading={isLoadingTeamCount}
            loadingLabel={t('tournament.steps.parameters.groupSize.loadingLabel')}
          />
        )}
      </div>

      <RadioGroup
        name="two-legged"
        label={t('tournament.steps.parameters.twoLegged.label')}
        direction="row"
        options={yesNoOptions}
        value={twoLegged}
        onChange={onTwoLeggedChange}
      />

      {showThirdPlaceMatch && (
        <RadioGroup
          name="third-place-match"
          label={t('tournament.steps.parameters.thirdPlaceMatch.label')}
          direction="row"
          options={yesNoOptions}
          value={thirdPlaceMatch}
          onChange={onThirdPlaceMatchChange}
        />
      )}

      <RadioGroup
        name="match-mode"
        label={t('tournament.steps.parameters.matchMode.label')}
        direction="row"
        options={matchModeOptions}
        value={matchMode}
        onChange={onMatchModeChange}
        isLoading={isLoadingMatchMode}
        loadingLabel={t('tournament.steps.parameters.matchMode.loadingLabel')}
      />

      <Select
        label={t('tournament.steps.parameters.consoleCount.label')}
        placeholder={t('tournament.steps.parameters.consoleCount.placeholder')}
        options={consoleCountOptions}
        value={consoleCount}
        onChange={onConsoleCountChange}
        isLoading={isLoadingConsoleType}
        loadingLabel={t('tournament.steps.parameters.consoleCount.loadingLabel')}
      />

      {consoles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consoles.map((consoleType, index) => (
            <Select
              key={index}
              label={t('tournament.steps.parameters.consoleType.label', { index: index + 1 })}
              options={consoleTypeOptions}
              value={consoleType}
              onChange={(value) => onConsoleTypeChange(index, value)}
              isLoading={isLoadingConsoleType}
              loadingLabel={t('tournament.steps.parameters.consoleType.loadingLabel')}
            />
          ))}
        </div>
      )}
    </StepsLayout>
  )
}

export default ParameterStep
