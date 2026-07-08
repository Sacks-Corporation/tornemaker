import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import Alert from '../../../../common/Alert'

export interface ConfirmationTeamSummary {
  index: number
  name: string
  players: string[]
}

export interface ConfirmationStepProps {
  formatLabel: string
  name: string
  teamCount: number
  showGroupSize: boolean
  groupSize: number | null
  twoLeggedLabel: string
  showThirdPlaceMatch: boolean
  thirdPlaceMatchLabel: string
  matchModeLabel: string
  consoleLabels: string[]
  teams: ConfirmationTeamSummary[]
  aiTeamLabel: string
  errorMessage: string | null
  isSubmitting: boolean
  currentStep: number
  totalSteps: number
  onBack: () => void
  onSubmit: () => void
}

function ConfirmationStep({
  formatLabel,
  name,
  teamCount,
  showGroupSize,
  groupSize,
  twoLeggedLabel,
  showThirdPlaceMatch,
  thirdPlaceMatchLabel,
  matchModeLabel,
  consoleLabels,
  teams,
  aiTeamLabel,
  errorMessage,
  isSubmitting,
  currentStep,
  totalSteps,
  onBack,
  onSubmit,
}: ConfirmationStepProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('tournament.steps.confirmation.title')}
      onBack={onBack}
      onNext={onSubmit}
      nextDisabled={isSubmitting}
      isNextLoading={isSubmitting}
      nextLabel={
        isSubmitting
          ? t('tournament.steps.confirmation.submitting')
          : t('tournament.steps.confirmation.submit')
      }
    >
      {errorMessage && <Alert variant="warning">{errorMessage}</Alert>}

      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-border bg-background p-3 text-sm sm:grid-cols-2 sm:p-4">
        <div>
          <dt className="text-text-muted">{t('tournament.steps.confirmation.formatLabel')}</dt>
          <dd className="font-medium text-text">{formatLabel}</dd>
        </div>
        <div>
          <dt className="text-text-muted">{t('tournament.steps.confirmation.nameLabel')}</dt>
          <dd className="font-medium text-text">{name}</dd>
        </div>
        <div>
          <dt className="text-text-muted">{t('tournament.steps.confirmation.teamCountLabel')}</dt>
          <dd className="font-medium text-text">{teamCount}</dd>
        </div>
        {showGroupSize && (
          <div>
            <dt className="text-text-muted">{t('tournament.steps.confirmation.groupSizeLabel')}</dt>
            <dd className="font-medium text-text">{groupSize}</dd>
          </div>
        )}
        <div>
          <dt className="text-text-muted">{t('tournament.steps.confirmation.twoLeggedLabel')}</dt>
          <dd className="font-medium text-text">{twoLeggedLabel}</dd>
        </div>
        {showThirdPlaceMatch && (
          <div>
            <dt className="text-text-muted">
              {t('tournament.steps.confirmation.thirdPlaceMatchLabel')}
            </dt>
            <dd className="font-medium text-text">{thirdPlaceMatchLabel}</dd>
          </div>
        )}
        <div>
          <dt className="text-text-muted">{t('tournament.steps.confirmation.matchModeLabel')}</dt>
          <dd className="font-medium text-text">{matchModeLabel}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-text-muted">{t('tournament.steps.confirmation.consolesLabel')}</dt>
          <dd className="font-medium text-text">{consoleLabels.join(', ')}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-text">
          {t('tournament.steps.confirmation.teamsLabel')}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.index}
              className="rounded-lg border border-border bg-background p-3 text-sm"
            >
              <p className="font-medium text-text">{team.name}</p>
              <p className="text-text-muted">
                {team.players.length > 0 ? team.players.join(', ') : aiTeamLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </StepsLayout>
  )
}

export default ConfirmationStep
