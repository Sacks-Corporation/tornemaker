import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TeamsStep from './TeamsStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import { getFilledNames, hasDuplicateNames } from '../../../../../utils/tournament.utils'

export interface TeamsStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function TeamsStepContainer({ wizard, currentStep, totalSteps }: TeamsStepContainerProps) {
  const { t } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { teams } = wizard.data

  const handleNext = () => {
    const filled = getFilledNames(teams)

    if (filled.length !== teams.length) {
      setErrorMessage(t('tournament.steps.teams.errors.required'))
      return
    }

    if (hasDuplicateNames(teams)) {
      setErrorMessage(t('tournament.steps.teams.errors.duplicate'))
      return
    }

    setErrorMessage(null)
    wizard.goNext()
  }

  return (
    <TeamsStep
      teams={teams}
      onTeamChange={wizard.setTeamNameAt}
      allowsAi={wizard.allowsAi}
      errorMessage={errorMessage}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={wizard.goBack}
      onNext={handleNext}
    />
  )
}

export default TeamsStepContainer
