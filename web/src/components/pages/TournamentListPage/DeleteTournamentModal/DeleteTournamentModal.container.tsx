import { useTranslation } from 'react-i18next'
import DeleteTournamentModal from './DeleteTournamentModal'
import { useDeleteTournamentMutation } from '../../../../hooks/tournaments/useTournamentMutations'
import { getApiErrorMessage } from '../../../../utils/api.errors'

export interface DeleteTournamentModalContainerProps {
  tournamentId: string
  tournamentName: string
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

// Dispara el DELETE real solo al confirmar. Mientras la mutación está en
// curso se deshabilita tanto el botón de confirmar como el cierre del modal,
// para evitar doble click / cierres accidentales a mitad de un borrado.
function DeleteTournamentModalContainer({
  tournamentId,
  tournamentName,
  onClose,
  onSuccess,
  onError,
}: DeleteTournamentModalContainerProps) {
  const { t } = useTranslation()
  const mutation = useDeleteTournamentMutation()

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const handleConfirm = () => {
    mutation.mutate(tournamentId, {
      onSuccess: () => onSuccess(),
      onError: (error) => {
        onError(getApiErrorMessage(error, t('tournament.list.deleteModal.errors.generic')))
      },
    })
  }

  return (
    <DeleteTournamentModal
      tournamentName={tournamentName}
      isSubmitting={mutation.isPending}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  )
}

export default DeleteTournamentModalContainer
