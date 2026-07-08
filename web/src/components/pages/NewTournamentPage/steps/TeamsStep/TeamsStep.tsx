import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import TextInput from '../../../../common/TextInput'
import Alert from '../../../../common/Alert'

export interface TeamsStepProps {
  teams: string[]
  onTeamChange: (index: number, value: string) => void
  allowsAi: boolean
  errorMessage: string | null
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
}

function TeamsStep({
  teams,
  onTeamChange,
  allowsAi,
  errorMessage,
  currentStep,
  totalSteps,
  onBack,
  onNext,
}: TeamsStepProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('tournament.steps.teams.title')}
      onBack={onBack}
      onNext={onNext}
    >
      <Alert variant={allowsAi ? 'info' : 'warning'}>
        {allowsAi ? t('tournament.steps.teams.aiAlert') : t('tournament.steps.teams.assignedNote')}
      </Alert>

      {errorMessage && <Alert variant="warning">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {teams.map((team, index) => (
          <TextInput
            key={index}
            label={t('tournament.steps.teams.teamLabel', { index: index + 1 })}
            placeholder={t('tournament.steps.teams.teamPlaceholder')}
            value={team}
            onChange={(event) => onTeamChange(index, event.target.value)}
          />
        ))}
      </div>
    </StepsLayout>
  )
}

export default TeamsStep
