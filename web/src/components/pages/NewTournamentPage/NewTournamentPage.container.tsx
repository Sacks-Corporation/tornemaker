import NewTournamentPage from './NewTournamentPage'
import FormatStep from './steps/FormatStep'
import ParameterStep from './steps/ParameterStep'
import TeamsStep from './steps/TeamsStep'
import PlayersStep from './steps/PlayersStep'
import TeamPlayersStep from './steps/TeamPlayersStep'
import ConfirmationStep from './steps/ConfirmationStep'
import { useNewTournamentWizard } from '../../../hooks/tournaments/useNewTournamentWizard'
import { getWizardStepMeta } from '../../../utils/tournament.utils'

// Orquesta el wizard de creación de torneo: instancia el estado (persistido
// en sessionStorage) una única vez y renderiza el step activo.
function NewTournamentPageContainer() {
  const wizard = useNewTournamentWizard()
  const { currentStep, totalSteps } = getWizardStepMeta(wizard.data.step, wizard.data.assignmentMethod)

  const stepProps = { wizard, currentStep, totalSteps }

  const renderStep = () => {
    switch (wizard.data.step) {
      case 'format':
        return <FormatStep {...stepProps} />
      case 'parameters':
        return <ParameterStep {...stepProps} />
      case 'teams':
        return <TeamsStep {...stepProps} />
      case 'players':
        return <PlayersStep {...stepProps} />
      case 'teamPlayers':
        return <TeamPlayersStep {...stepProps} />
      case 'confirmation':
        return <ConfirmationStep {...stepProps} />
      default:
        return null
    }
  }

  return <NewTournamentPage>{renderStep()}</NewTournamentPage>
}

export default NewTournamentPageContainer
