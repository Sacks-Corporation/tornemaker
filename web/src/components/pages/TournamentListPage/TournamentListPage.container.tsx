import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import TournamentListPage from './TournamentListPage'
import type { TournamentListItem } from './TournamentListPage'
import DeleteTournamentModal from './DeleteTournamentModal'
import Snackbar from '../../common/Snackbar'
import { useTournamentsQuery } from '../../../hooks/tournaments/useTournamentQueries'
import { formatDate } from '../../../utils/date.utils'
import type { SnackbarVariant } from '../../../types/common.types'

interface SnackbarState {
  message: string
  variant: SnackbarVariant
}

// Orquesta la pantalla de listado de torneos guardados: fetch liviano
// (GET /tournaments) + mapeo a props de presentación (labels ya traducidos).
// La navegación al detalle usa el `_id` del torneo por URL, igual que
// TournamentPage lo lee con useParams. También maneja el borrado de un
// torneo desde su card (modal de confirmación + snackbar de feedback).
function TournamentListPageContainer() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const tournamentsQuery = useTournamentsQuery()

  const [tournamentToDelete, setTournamentToDelete] = useState<TournamentListItem | null>(null)
  const [snackbarState, setSnackbarState] = useState<SnackbarState | null>(null)

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

  const handleDeleteTournament = (tournament: TournamentListItem) => {
    setTournamentToDelete(tournament)
  }

  const handleCloseDeleteModal = () => setTournamentToDelete(null)

  const handleDeleteSuccess = () => {
    setTournamentToDelete(null)
    setSnackbarState({ message: t('tournament.list.snackbar.success'), variant: 'success' })
  }

  const handleDeleteError = (message: string) => {
    setSnackbarState({ message, variant: 'error' })
  }

  const modal = tournamentToDelete && (
    <DeleteTournamentModal
      tournamentId={tournamentToDelete.id}
      tournamentName={tournamentToDelete.name}
      onClose={handleCloseDeleteModal}
      onSuccess={handleDeleteSuccess}
      onError={handleDeleteError}
    />
  )

  const snackbar = (
    <Snackbar
      message={snackbarState?.message ?? null}
      variant={snackbarState?.variant}
      onClose={() => setSnackbarState(null)}
    />
  )

  return (
    <TournamentListPage
      isLoading={tournamentsQuery.isLoading}
      isError={tournamentsQuery.isError}
      tournaments={tournaments}
      onSelectTournament={handleSelectTournament}
      onCreateClick={handleCreateClick}
      onDeleteTournament={handleDeleteTournament}
      modal={modal}
      snackbar={snackbar}
    />
  )
}

export default TournamentListPageContainer
