import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MatchResultModal from './MatchResultModal'
import type { MatchResultModalStep } from './MatchResultModal'
import { useMatchResultMutation } from '../../../../hooks/tournaments/useTournamentMutations'
import { getApiErrorMessage } from '../../../../utils/api.errors'
import { getAggregateScore, isTiedResult } from '../../../../utils/tournament.utils'
import type { RadioOption } from '../../../../types/common.types'
import type { UpcomingMatch } from '../../../../types/tournament.types'

export interface MatchResultModalContainerProps {
  tournamentId: string
  match: UpcomingMatch
  legLabel?: string
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

// Maneja el formulario de carga de resultado (goles + penales cuando
// corresponde) y el paso de confirmación antes de disparar el PATCH real.
// El global ida+vuelta que se muestra acá es solo una conveniencia visual: el
// back valida el resultado igual.
function MatchResultModalContainer({
  tournamentId,
  match,
  legLabel,
  onClose,
  onSuccess,
  onError,
}: MatchResultModalContainerProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<MatchResultModalStep>('form')
  const [homeGoalsValue, setHomeGoalsValue] = useState('')
  const [awayGoalsValue, setAwayGoalsValue] = useState('')
  const [penaltyWinnerTeamId, setPenaltyWinnerTeamId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const mutation = useMatchResultMutation(tournamentId)

  const parsedHomeGoals = homeGoalsValue.trim() === '' ? null : Number(homeGoalsValue)
  const parsedAwayGoals = awayGoalsValue.trim() === '' ? null : Number(awayGoalsValue)
  const hasValidGoals =
    parsedHomeGoals !== null &&
    parsedAwayGoals !== null &&
    Number.isInteger(parsedHomeGoals) &&
    Number.isInteger(parsedAwayGoals) &&
    parsedHomeGoals >= 0 &&
    parsedAwayGoals >= 0

  const isTied = hasValidGoals && isTiedResult(match, parsedHomeGoals, parsedAwayGoals)
  const showPenaltySelector = match.allowsPenalties && isTied

  const aggregate =
    match.legNumber === 2 && hasValidGoals
      ? getAggregateScore(match.firstLegResult, parsedHomeGoals, parsedAwayGoals)
      : null
  const aggregateLabel = aggregate
    ? t('tournament.tournamentPage.resultModal.aggregateValue', {
        home: aggregate.homeGoals,
        away: aggregate.awayGoals,
      })
    : undefined

  const continueDisabled = !hasValidGoals || (showPenaltySelector && !penaltyWinnerTeamId)

  const handleHomeGoalsChange = (value: string) => {
    setHomeGoalsValue(value)
    setPenaltyWinnerTeamId(null)
  }

  const handleAwayGoalsChange = (value: string) => {
    setAwayGoalsValue(value)
    setPenaltyWinnerTeamId(null)
  }

  const handleContinue = () => {
    if (!hasValidGoals) {
      setValidationError(t('tournament.tournamentPage.resultModal.errors.invalidScore'))
      return
    }
    if (showPenaltySelector && !penaltyWinnerTeamId) {
      setValidationError(t('tournament.tournamentPage.resultModal.errors.penaltyRequired'))
      return
    }
    setValidationError(null)
    setStep('confirm')
  }

  const handleBack = () => setStep('form')

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const handleConfirm = () => {
    if (!hasValidGoals) return

    mutation.mutate(
      {
        matchId: match.matchId,
        payload: {
          homeGoals: parsedHomeGoals,
          awayGoals: parsedAwayGoals,
          ...(showPenaltySelector && penaltyWinnerTeamId ? { penaltyWinnerTeamId } : {}),
        },
      },
      {
        onSuccess: () => onSuccess(),
        onError: (error) => {
          onError(getApiErrorMessage(error, t('tournament.tournamentPage.resultModal.errors.generic')))
        },
      },
    )
  }

  const penaltyOptions: RadioOption[] = [
    { value: match.homeTeam.teamId, label: match.homeTeam.name },
    { value: match.awayTeam.teamId, label: match.awayTeam.name },
  ]

  const confirmScoreLabel = `${match.homeTeam.name} ${parsedHomeGoals ?? 0} - ${parsedAwayGoals ?? 0} ${match.awayTeam.name}`
  const confirmPenaltyWinnerName =
    showPenaltySelector && penaltyWinnerTeamId
      ? penaltyWinnerTeamId === match.homeTeam.teamId
        ? match.homeTeam.name
        : match.awayTeam.name
      : undefined

  return (
    <MatchResultModal
      step={step}
      phaseLabel={t(`tournament.tournamentPage.phases.${match.phase}`)}
      roundLabel={match.roundLabel}
      groupLabel={match.groupName}
      legLabel={legLabel}
      consoleLabel={t('tournament.tournamentPage.upcomingBar.console', {
        console: t(`tournament.consoleTypes.${match.assignedConsole}`),
      })}
      firstLegResultLabel={
        match.firstLegResult
          ? t('tournament.tournamentPage.upcomingBar.firstLegResult', {
              home: match.firstLegResult.homeGoals,
              away: match.firstLegResult.awayGoals,
            })
          : undefined
      }
      homeTeam={match.homeTeam}
      awayTeam={match.awayTeam}
      homeGoalsValue={homeGoalsValue}
      awayGoalsValue={awayGoalsValue}
      onHomeGoalsChange={handleHomeGoalsChange}
      onAwayGoalsChange={handleAwayGoalsChange}
      showPenaltySelector={showPenaltySelector}
      penaltyOptions={penaltyOptions}
      penaltyWinnerTeamId={penaltyWinnerTeamId}
      onPenaltyWinnerChange={setPenaltyWinnerTeamId}
      aggregateLabel={aggregateLabel}
      validationError={validationError}
      isSubmitting={mutation.isPending}
      continueDisabled={continueDisabled}
      confirmScoreLabel={confirmScoreLabel}
      confirmPenaltyWinnerName={confirmPenaltyWinnerName}
      onClose={handleClose}
      onContinue={handleContinue}
      onBack={handleBack}
      onConfirm={handleConfirm}
    />
  )
}

export default MatchResultModalContainer
