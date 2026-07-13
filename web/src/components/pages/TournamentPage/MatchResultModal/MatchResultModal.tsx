import { useTranslation } from 'react-i18next'
import Modal from '../../../common/Modal'
import TextInput from '../../../common/TextInput'
import RadioGroup from '../../../common/RadioGroup'
import Button from '../../../common/Button'
import Alert from '../../../common/Alert'
import type { RadioOption } from '../../../../types/common.types'

export interface MatchResultModalTeam {
  teamId: string
  name: string
  playerNames: string[]
}

export type MatchResultModalStep = 'form' | 'confirm'

export interface MatchResultModalProps {
  step: MatchResultModalStep
  phaseLabel: string
  roundLabel: string
  groupLabel?: string
  legLabel?: string
  consoleLabel: string
  firstLegResultLabel?: string
  homeTeam: MatchResultModalTeam
  awayTeam: MatchResultModalTeam
  homeGoalsValue: string
  awayGoalsValue: string
  onHomeGoalsChange: (value: string) => void
  onAwayGoalsChange: (value: string) => void
  showPenaltySelector: boolean
  penaltyOptions: RadioOption[]
  penaltyWinnerTeamId: string | null
  onPenaltyWinnerChange: (teamId: string) => void
  aggregateLabel?: string
  validationError: string | null
  isSubmitting: boolean
  continueDisabled: boolean
  confirmScoreLabel: string
  confirmPenaltyWinnerName?: string
  onClose: () => void
  onContinue: () => void
  onBack: () => void
  onConfirm: () => void
}

// Modal de carga de resultado, en dos pasos: formulario (goles + penales si
// corresponde) y confirmación (resumen + advertencia de que no se puede
// editar después). El PATCH real solo se dispara al confirmar.
function MatchResultModal({
  step,
  phaseLabel,
  roundLabel,
  groupLabel,
  legLabel,
  consoleLabel,
  firstLegResultLabel,
  homeTeam,
  awayTeam,
  homeGoalsValue,
  awayGoalsValue,
  onHomeGoalsChange,
  onAwayGoalsChange,
  showPenaltySelector,
  penaltyOptions,
  penaltyWinnerTeamId,
  onPenaltyWinnerChange,
  aggregateLabel,
  validationError,
  isSubmitting,
  continueDisabled,
  confirmScoreLabel,
  confirmPenaltyWinnerName,
  onClose,
  onContinue,
  onBack,
  onConfirm,
}: MatchResultModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        step === 'form'
          ? t('tournament.tournamentPage.resultModal.title')
          : t('tournament.tournamentPage.resultModal.confirmTitle')
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <span>
            {phaseLabel} · {roundLabel}
            {groupLabel ? ` · ${groupLabel}` : ''}
          </span>
          {legLabel && <span className="rounded-full bg-primary/10 px-2 py-0.5">{legLabel}</span>}
        </div>

        <p className="text-xs font-medium text-text-muted">{consoleLabel}</p>
        {firstLegResultLabel && <p className="text-xs text-text-muted">{firstLegResultLabel}</p>}

        <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
          <p className="font-semibold text-text">{homeTeam.name}</p>
          {homeTeam.playerNames.length > 0 && (
            <p className="text-xs text-text-muted">{homeTeam.playerNames.join(', ')}</p>
          )}
          <p className="my-1 text-center text-xs font-medium text-text-muted">vs</p>
          <p className="font-semibold text-text">{awayTeam.name}</p>
          {awayTeam.playerNames.length > 0 && (
            <p className="text-xs text-text-muted">{awayTeam.playerNames.join(', ')}</p>
          )}
        </div>

        {step === 'form' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label={t('tournament.tournamentPage.resultModal.homeGoalsLabel', { team: homeTeam.name })}
                type="number"
                min={0}
                inputMode="numeric"
                value={homeGoalsValue}
                onChange={(event) => onHomeGoalsChange(event.target.value)}
              />
              <TextInput
                label={t('tournament.tournamentPage.resultModal.awayGoalsLabel', { team: awayTeam.name })}
                type="number"
                min={0}
                inputMode="numeric"
                value={awayGoalsValue}
                onChange={(event) => onAwayGoalsChange(event.target.value)}
              />
            </div>

            {aggregateLabel && <p className="text-sm text-text-muted">{aggregateLabel}</p>}

            {showPenaltySelector && (
              <RadioGroup
                name="penalty-winner"
                label={t('tournament.tournamentPage.resultModal.penaltiesQuestion')}
                direction="row"
                options={penaltyOptions}
                value={penaltyWinnerTeamId}
                onChange={onPenaltyWinnerChange}
              />
            )}

            {validationError && <Alert variant="warning">{validationError}</Alert>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t('tournament.tournamentPage.resultModal.cancel')}
              </Button>
              <Button type="button" variant="primary" onClick={onContinue} disabled={continueDisabled}>
                {t('tournament.tournamentPage.resultModal.continue')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-lg font-bold text-text">{confirmScoreLabel}</p>
              {confirmPenaltyWinnerName && (
                <p className="text-sm text-text-muted">
                  {t('tournament.tournamentPage.resultModal.penaltiesQuestion')} {confirmPenaltyWinnerName}
                </p>
              )}
            </div>

            <Alert variant="warning">{t('tournament.tournamentPage.resultModal.confirmWarning')}</Alert>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
                {t('tournament.tournamentPage.resultModal.back')}
              </Button>
              <Button type="button" variant="primary" onClick={onConfirm} disabled={isSubmitting}>
                {isSubmitting
                  ? t('tournament.tournamentPage.resultModal.submitting')
                  : t('tournament.tournamentPage.resultModal.confirmButton')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default MatchResultModal
