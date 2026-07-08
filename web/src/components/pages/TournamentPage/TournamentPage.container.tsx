import { useParams } from 'react-router-dom'
import TournamentPage from './TournamentPage'

function TournamentPageContainer() {
  const { id } = useParams<{ id: string }>()

  return <TournamentPage tournamentId={id ?? ''} />
}

export default TournamentPageContainer
