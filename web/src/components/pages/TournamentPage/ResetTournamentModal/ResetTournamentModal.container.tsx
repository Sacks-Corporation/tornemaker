import { useTranslation } from 'react-i18next'
import ResetTournamentModal from './ResetTournamentModal'
import { useResetTournamentMutation } from '../../../../hooks/tournaments/useTournamentMutations'
import { getApiErrorMessage } from '../../../../utils/api.errors'

export interface ResetTournamentModalContainerProps {
  tournamentId: string
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

// Dispara el reseteo real solo al confirmar. Mientras la mutación está en
// curso se deshabilita tanto el botón de confirmar como el cierre del modal,
// para evitar doble click / cierres accidentales a mitad de un reseteo.
function ResetTournamentModalContainer({
  tournamentId,
  onClose,
  onSuccess,
  onError,
}: ResetTournamentModalContainerProps) {
  const { t } = useTranslation()
  const mutation = useResetTournamentMutation(tournamentId)

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const handleConfirm = () => {
    mutation.mutate(undefined, {
      onSuccess: () => onSuccess(),
      onError: (error) => {
        onError(getApiErrorMessage(error, t('tournament.tournamentPage.resetModal.errors.generic')))
      },
    })
  }

  return (
    <ResetTournamentModal
      isSubmitting={mutation.isPending}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  )
}

export default ResetTournamentModalContainer
