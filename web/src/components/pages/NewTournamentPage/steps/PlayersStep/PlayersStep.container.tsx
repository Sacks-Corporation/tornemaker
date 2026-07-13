import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PlayersStep from './PlayersStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import { getCatalogLabel, getFilledNames, hasDuplicateNames } from '../../../../../utils/tournament.utils'
import type { RadioOption } from '../../../../../types/common.types'
import type { AssignmentMethod } from '../../../../../types/tournament.types'

export interface PlayersStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function PlayersStepContainer({ wizard, currentStep, totalSteps }: PlayersStepContainerProps) {
  const { t } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<AssignmentMethod | null>(null)

  const { players } = wizard.data

  const assignmentMethodOptions: RadioOption<AssignmentMethod>[] = [
    { value: 'MANUAL', label: t('tournament.steps.assignmentModal.manual') },
    { value: 'DRAW', label: t('tournament.steps.assignmentModal.draw') },
    {
      value: 'ROULETTE',
      label: `${t('tournament.steps.assignmentModal.roulette')} (${t('tournament.steps.assignmentModal.rouletteComingSoon')})`,
      disabled: true,
    },
  ]

  const handleNext = () => {
    const filled = getFilledNames(players)

    if (hasDuplicateNames(players)) {
      setErrorMessage(t('tournament.steps.players.errors.duplicate'))
      return
    }

    if (filled.length % wizard.perTeam !== 0) {
      setErrorMessage(t('tournament.steps.players.errors.notMultipleOfPerTeam'))
      return
    }

    if (!wizard.allowsAi && filled.length !== players.length) {
      setErrorMessage(t('tournament.steps.players.errors.allRequired'))
      return
    }

    setErrorMessage(null)
    setSelectedMethod(null)
    setIsModalOpen(true)
  }

  const handleConfirmAssignmentMethod = () => {
    if (!selectedMethod) return
    wizard.chooseAssignmentMethod(selectedMethod)
    setIsModalOpen(false)
  }

  return (
    <PlayersStep
      players={players}
      onPlayerChange={wizard.setPlayerNameAt}
      allowsAi={wizard.allowsAi}
      matchModeLabel={getCatalogLabel(wizard.matchModes, wizard.data.matchMode)}
      perTeam={wizard.perTeam}
      errorMessage={errorMessage}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={wizard.goBack}
      onNext={handleNext}
      isModalOpen={isModalOpen}
      onModalClose={() => setIsModalOpen(false)}
      assignmentMethodOptions={assignmentMethodOptions}
      selectedAssignmentMethod={selectedMethod}
      onSelectedAssignmentMethodChange={setSelectedMethod}
      onConfirmAssignmentMethod={handleConfirmAssignmentMethod}
    />
  )
}

export default PlayersStepContainer
