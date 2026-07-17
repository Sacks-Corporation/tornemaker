import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import TextInput from '../../../../common/TextInput'
import NumberInput from '../../../../common/NumberInput'
import Select from '../../../../common/Select'
import RadioGroup from '../../../../common/RadioGroup'
import Switch from '../../../../common/Switch'
import Alert from '../../../../common/Alert'
import type { SelectOption, RadioOption } from '../../../../../types/common.types'
import type { ConsoleCode, MatchModeCode } from '../../../../../types/tournament.types'

export interface ParameterStepProps {
  formatLabel: string
  name: string
  onNameChange: (value: string) => void

  // Cantidad de equipos: input numérico libre (SINGLE_ELIMINATION,
  // GROUP_STAGE_PLUS_ELIMINATION) o Select de opciones (LEAGUE,
  // SWISS_PLUS_ELIMINATION), según el formato elegido.
  useTeamCountInput: boolean
  teamCountValue: string
  onTeamCountValueChange: (value: string) => void
  teamCountMin?: number
  teamCountMax?: number
  teamCountError: string | null
  teamCountOptions: SelectOption[]
  teamCount: string | null
  onTeamCountChange: (value: string) => void
  isLoadingTeamCount: boolean

  showGroupCap: boolean
  groupCapValue: string
  onGroupCapValueChange: (value: string) => void
  groupCapMin: number
  groupCapError: string | null

  showAiFill: boolean
  aiFill: boolean
  onAiFillChange: (value: boolean) => void

  previewLines: string[]

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
  useTeamCountInput,
  teamCountValue,
  onTeamCountValueChange,
  teamCountMin,
  teamCountMax,
  teamCountError,
  teamCountOptions,
  teamCount,
  onTeamCountChange,
  isLoadingTeamCount,
  showGroupCap,
  groupCapValue,
  onGroupCapValueChange,
  groupCapMin,
  groupCapError,
  showAiFill,
  aiFill,
  onAiFillChange,
  previewLines,
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
        {useTeamCountInput ? (
          <NumberInput
            label={t('tournament.steps.parameters.teamCount.label')}
            placeholder={t('tournament.steps.parameters.teamCount.numberPlaceholder')}
            min={teamCountMin}
            max={teamCountMax}
            value={teamCountValue}
            onChange={(event) => onTeamCountValueChange(event.target.value)}
            error={teamCountError ?? undefined}
            disabled={isLoadingTeamCount}
          />
        ) : (
          <Select
            label={t('tournament.steps.parameters.teamCount.label')}
            placeholder={t('tournament.steps.parameters.teamCount.placeholder')}
            options={teamCountOptions}
            value={teamCount}
            onChange={onTeamCountChange}
            isLoading={isLoadingTeamCount}
            loadingLabel={t('tournament.steps.parameters.teamCount.loadingLabel')}
          />
        )}

        {showGroupCap && (
          <NumberInput
            label={t('tournament.steps.parameters.groupCap.label')}
            placeholder={t('tournament.steps.parameters.groupCap.placeholder')}
            min={groupCapMin}
            value={groupCapValue}
            onChange={(event) => onGroupCapValueChange(event.target.value)}
            error={groupCapError ?? undefined}
            disabled={isLoadingTeamCount}
          />
        )}
      </div>

      {showAiFill && (
        <Switch
          label={t('tournament.steps.parameters.aiFill.label')}
          description={t('tournament.steps.parameters.aiFill.description')}
          checked={aiFill}
          onChange={onAiFillChange}
        />
      )}

      {previewLines.length > 0 && (
        <Alert variant="info" title={t('tournament.steps.parameters.preview.title')}>
          <ul className="list-disc space-y-1 pl-4">
            {previewLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </Alert>
      )}

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
