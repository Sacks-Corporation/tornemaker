import { useTranslation } from 'react-i18next'
import Modal from '../../../common/Modal'
import Button from '../../../common/Button'

export interface DeleteTournamentModalProps {
  tournamentName: string
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

// Modal de confirmación antes de borrar un torneo desde el listado. De cara
// al usuario el borrado es definitivo (aunque el back lo resuelva como
// borrado lógico), por eso la advertencia de que no se puede deshacer.
function DeleteTournamentModal({
  tournamentName,
  isSubmitting,
  onClose,
  onConfirm,
}: DeleteTournamentModalProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen onClose={onClose} title={t('tournament.list.deleteModal.title')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">
          {t('tournament.list.deleteModal.message', { name: tournamentName })}
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('tournament.list.deleteModal.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? t('tournament.list.deleteModal.confirming')
              : t('tournament.list.deleteModal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default DeleteTournamentModal
