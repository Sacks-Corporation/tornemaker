import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import TextInput from '../../../../common/TextInput'
import Alert from '../../../../common/Alert'
import Modal from '../../../../common/Modal'
import RadioGroup from '../../../../common/RadioGroup'
import Button from '../../../../common/Button'
import type { RadioOption } from '../../../../../types/common.types'
import type { AssignmentMethod } from '../../../../../types/tournament.types'

export interface PlayersStepProps {
  players: string[]
  onPlayerChange: (index: number, value: string) => void
  allowsAi: boolean
  matchModeLabel: string
  perTeam: number
  errorMessage: string | null
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  isModalOpen: boolean
  onModalClose: () => void
  assignmentMethodOptions: RadioOption<AssignmentMethod>[]
  selectedAssignmentMethod: AssignmentMethod | null
  onSelectedAssignmentMethodChange: (method: AssignmentMethod) => void
  onConfirmAssignmentMethod: () => void
}

function PlayersStep({
  players,
  onPlayerChange,
  allowsAi,
  matchModeLabel,
  perTeam,
  errorMessage,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  isModalOpen,
  onModalClose,
  assignmentMethodOptions,
  selectedAssignmentMethod,
  onSelectedAssignmentMethodChange,
  onConfirmAssignmentMethod,
}: PlayersStepProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('tournament.steps.players.title')}
      onBack={onBack}
      onNext={onNext}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
          {matchModeLabel}
        </span>
        <p className="text-sm text-text-muted">
          {t('tournament.steps.players.matchModeLegend', { perTeam })}
        </p>
      </div>

      <Alert variant={allowsAi ? 'info' : 'warning'}>
        {allowsAi ? t('tournament.steps.players.aiLegend') : t('tournament.steps.players.assignedLegend')}
      </Alert>

      {errorMessage && <Alert variant="warning">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {players.map((player, index) => (
          <TextInput
            key={index}
            label={t('tournament.steps.players.playerLabel', { index: index + 1 })}
            placeholder={t('tournament.steps.players.playerPlaceholder')}
            value={player}
            onChange={(event) => onPlayerChange(index, event.target.value)}
          />
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={onModalClose}
        title={t('tournament.steps.assignmentModal.title')}
      >
        <RadioGroup
          name="assignment-method"
          options={assignmentMethodOptions}
          value={selectedAssignmentMethod}
          onChange={onSelectedAssignmentMethodChange}
        />

        <div className="mt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onModalClose}>
            {t('tournament.steps.assignmentModal.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirmAssignmentMethod}
            disabled={selectedAssignmentMethod === null}
          >
            {t('tournament.steps.assignmentModal.confirm')}
          </Button>
        </div>
      </Modal>
    </StepsLayout>
  )
}

export default PlayersStep
