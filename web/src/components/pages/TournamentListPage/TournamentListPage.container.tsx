import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import TournamentListPage from './TournamentListPage'
import type { TournamentListItem } from './TournamentListPage'
import { useTournamentsQuery } from '../../../hooks/tournaments/useTournamentQueries'
import { formatDate } from '../../../utils/date.utils'

// Orquesta la pantalla de listado de torneos guardados: fetch liviano
// (GET /tournaments) + mapeo a props de presentación (labels ya traducidos).
// La navegación al detalle usa el `_id` del torneo por URL, igual que
// TournamentPage lo lee con useParams.
function TournamentListPageContainer() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const tournamentsQuery = useTournamentsQuery()

  const tournaments: TournamentListItem[] = (tournamentsQuery.data ?? []).map((tournament) => ({
    id: tournament._id,
    name: tournament.name,
    formatLabel: t(`tournament.formats.${tournament.format}.title`),
    status: tournament.status,
    statusLabel: t(`tournament.list.status.${tournament.status}`),
    teamCountLabel: t('tournament.list.teamCount', { count: tournament.teamCount }),
    dateLabel: t('tournament.list.createdAt', { date: formatDate(new Date(tournament.createdAt)) }),
  }))

  const handleSelectTournament = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`)
  }

  const handleCreateClick = () => {
    navigate('/new')
  }

  return (
    <TournamentListPage
      isLoading={tournamentsQuery.isLoading}
      isError={tournamentsQuery.isError}
      tournaments={tournaments}
      onSelectTournament={handleSelectTournament}
      onCreateClick={handleCreateClick}
    />
  )
}

export default TournamentListPageContainer
