import { useTranslation } from 'react-i18next'
import Modal from '../../../common/Modal'
import Button from '../../../common/Button'

export interface ResetTournamentModalProps {
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

// Modal de confirmación antes de resetear un torneo desde la pantalla de
// simulación. El reseteo reinicia todos los partidos, por eso la advertencia
// de que no se puede deshacer (mismo patrón que DeleteTournamentModal).
function ResetTournamentModal({ isSubmitting, onClose, onConfirm }: ResetTournamentModalProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen onClose={onClose} title={t('tournament.tournamentPage.resetModal.title')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">{t('tournament.tournamentPage.resetModal.message')}</p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('tournament.tournamentPage.resetModal.cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting
              ? t('tournament.tournamentPage.resetModal.confirming')
              : t('tournament.tournamentPage.resetModal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ResetTournamentModal
