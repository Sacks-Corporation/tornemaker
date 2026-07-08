import { useTranslation } from 'react-i18next'
import StepsLayout from '../../../../common/StepsLayout'
import Select from '../../../../common/Select'
import Alert from '../../../../common/Alert'
import Button from '../../../../common/Button'

export interface TeamPlayersStepTeam {
  index: number
  name: string
  isAi: boolean
  slots: string[]
  slotOptions: string[][]
}

export interface TeamPlayersStepProps {
  teams: TeamPlayersStepTeam[]
  unassignedPlayers: string[]
  allowsAi: boolean
  onSlotChange: (teamIndex: number, slotIndex: number, value: string) => void
  onClearTeam: (teamIndex: number) => void
  errorMessage: string | null
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
}

function TeamPlayersStep({
  teams,
  unassignedPlayers,
  allowsAi,
  onSlotChange,
  onClearTeam,
  errorMessage,
  currentStep,
  totalSteps,
  onBack,
  onNext,
}: TeamPlayersStepProps) {
  const { t } = useTranslation()

  return (
    <StepsLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('tournament.steps.teamPlayers.title')}
      onBack={onBack}
      onNext={onNext}
    >
      <div className="rounded-lg border border-border bg-background p-3">
        <p className="mb-2 text-sm font-semibold text-text">
          {t('tournament.steps.teamPlayers.unassignedTitle')}
        </p>
        {unassignedPlayers.length === 0 ? (
          <p className="text-sm text-text-muted">{t('tournament.steps.teamPlayers.noUnassigned')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((player) => (
              <span
                key={player}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {player}
              </span>
            ))}
          </div>
        )}
      </div>

      {errorMessage && <Alert variant="warning">{errorMessage}</Alert>}

      <div className="flex flex-col gap-4">
        {teams.map((team) => (
          <div
            key={team.index}
            className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text">
                {t('tournament.steps.teamPlayers.teamLabel', { index: team.index + 1 })}: {team.name}
              </p>
              {allowsAi && !team.isAi && (
                <Button type="button" variant="text" size="sm" onClick={() => onClearTeam(team.index)}>
                  {t('tournament.steps.teamPlayers.markAsAi')}
                </Button>
              )}
              {allowsAi && team.isAi && (
                <span className="text-xs font-medium text-text-muted">
                  {t('tournament.steps.teamPlayers.aiTeam')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.slots.map((slotValue, slotIndex) => (
                <Select
                  key={slotIndex}
                  label={t('tournament.steps.teamPlayers.slotLabel', { index: slotIndex + 1 })}
                  placeholder={t('tournament.steps.teamPlayers.slotPlaceholder')}
                  options={team.slotOptions[slotIndex].map((player) => ({
                    value: player,
                    label: player,
                  }))}
                  value={slotValue || null}
                  onChange={(value) => onSlotChange(team.index, slotIndex, value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </StepsLayout>
  )
}

export default TeamPlayersStep
