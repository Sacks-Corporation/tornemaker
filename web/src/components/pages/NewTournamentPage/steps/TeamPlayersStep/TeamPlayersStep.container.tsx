import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TeamPlayersStep from './TeamPlayersStep'
import type { TeamPlayersStepTeam } from './TeamPlayersStep'
import type { NewTournamentWizard } from '../../../../../hooks/tournaments/useNewTournamentWizard'
import {
  getFilledNames,
  getTeamSlots,
  isTeamPlayersStepValid,
} from '../../../../../utils/tournament.utils'

export interface TeamPlayersStepContainerProps {
  wizard: NewTournamentWizard
  currentStep: number
  totalSteps: number
}

function TeamPlayersStepContainer({
  wizard,
  currentStep,
  totalSteps,
}: TeamPlayersStepContainerProps) {
  const { t } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, perTeam, allowsAi, unassignedPlayers } = wizard
  const teamCount = data.teamCount ?? 0

  const teams: TeamPlayersStepTeam[] = Array.from({ length: teamCount }, (_, index) => {
    const slots = getTeamSlots(data.assignments, index, perTeam)
    const filledSlots = getFilledNames(slots)
    const isAi = filledSlots.length === 0

    const slotOptions = slots.map((_, slotIndex) => {
      const otherSlotValues = slots.filter((_, i) => i !== slotIndex && slots[i].trim() !== '')
      const pool = [...unassignedPlayers, ...filledSlots]
      return Array.from(new Set(pool.filter((player) => !otherSlotValues.includes(player))))
    })

    return {
      index,
      name: data.teams[index] ?? '',
      isAi,
      slots,
      slotOptions,
    }
  })

  const handleSlotChange = (teamIndex: number, slotIndex: number, value: string) => {
    const slots = getTeamSlots(data.assignments, teamIndex, perTeam)
    const nextSlots = [...slots]
    nextSlots[slotIndex] = value
    wizard.setTeamAssignment(teamIndex, nextSlots)
  }

  const handleClearTeam = (teamIndex: number) => {
    wizard.setTeamAssignment(teamIndex, Array<string>(perTeam).fill(''))
  }

  const handleNext = () => {
    const totalFilledPlayers = getFilledNames(data.players).length
    const isValid = isTeamPlayersStepValid(
      teamCount,
      perTeam,
      data.assignments,
      allowsAi,
      totalFilledPlayers,
    )

    if (!isValid) {
      setErrorMessage(t('tournament.steps.teamPlayers.errors.pendingPlayers'))
      return
    }

    setErrorMessage(null)
    wizard.goNext()
  }

  return (
    <TeamPlayersStep
      teams={teams}
      unassignedPlayers={unassignedPlayers}
      allowsAi={allowsAi}
      onSlotChange={handleSlotChange}
      onClearTeam={handleClearTeam}
      errorMessage={errorMessage}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={wizard.goBack}
      onNext={handleNext}
    />
  )
}

export default TeamPlayersStepContainer
