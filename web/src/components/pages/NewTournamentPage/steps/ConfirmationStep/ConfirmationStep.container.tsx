import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ConfirmationStep from './ConfirmationStep'
import type { ConfirmationTeamSummary } from './ConfirmationStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import { useCreateTournamentMutation } from '../../../../../hooks/tournaments/useTournamentMutations'
import {
  buildTournamentPayload,
  getCatalogLabel,
  getFilledNames,
  usesFreeTeamCountInput,
} from '../../../../../utils/tournament.utils'

export interface ConfirmationStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function ConfirmationStepContainer({
  wizard,
  currentStep,
  totalSteps,
}: ConfirmationStepContainerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createTournamentMutation = useCreateTournamentMutation()
  const { data } = wizard
  const teamCount = data.teamCount ?? 0

  const formatLabel = data.format ? t(`tournament.formats.${data.format}.title`) : ''
  const showGroupCap = data.format === 'GROUP_STAGE_PLUS_ELIMINATION'
  const showThirdPlaceMatch = data.format !== 'LEAGUE'
  const showAiFill = usesFreeTeamCountInput(data.format) && wizard.allowsAi
  const matchModeLabel = getCatalogLabel(wizard.matchModes, data.matchMode)
  const consoleLabels = data.consoles.map((consoleType) => getCatalogLabel(wizard.consoles, consoleType))

  const teams: ConfirmationTeamSummary[] = Array.from({ length: teamCount }, (_, index) => {
    const assignment = data.assignments.find((item) => item.teamIndex === index)
    return {
      index,
      name: data.teams[index] ?? '',
      players: getFilledNames(assignment?.players ?? []),
    }
  })

  const handleSubmit = () => {
    setErrorMessage(null)
    const payload = buildTournamentPayload(data)

    createTournamentMutation.mutate(payload, {
      onSuccess: (tournament) => {
        wizard.clearWizard()
        navigate(`/tournament/${tournament._id}`, { replace: true })
      },
      onError: () => {
        setErrorMessage(t('tournament.steps.confirmation.errors.generic'))
      },
    })
  }

  return (
    <ConfirmationStep
      formatLabel={formatLabel}
      name={data.name}
      teamCount={teamCount}
      showGroupCap={showGroupCap}
      groupCap={data.groupCap}
      showAiFill={showAiFill}
      aiFillLabel={data.aiFill ? t('tournament.yesNo.yes') : t('tournament.yesNo.no')}
      twoLeggedLabel={data.twoLegged ? t('tournament.yesNo.yes') : t('tournament.yesNo.no')}
      showThirdPlaceMatch={showThirdPlaceMatch}
      thirdPlaceMatchLabel={data.thirdPlaceMatch ? t('tournament.yesNo.yes') : t('tournament.yesNo.no')}
      matchModeLabel={matchModeLabel}
      consoleLabels={consoleLabels}
      teams={teams}
      aiTeamLabel={t('tournament.steps.confirmation.aiTeam')}
      errorMessage={errorMessage}
      isSubmitting={createTournamentMutation.isPending}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={wizard.goBack}
      onSubmit={handleSubmit}
    />
  )
}

export default ConfirmationStepContainer
