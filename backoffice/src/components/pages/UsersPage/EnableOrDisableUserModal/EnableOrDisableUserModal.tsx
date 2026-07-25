import { useTranslation } from 'react-i18next'
import Modal from '../../../common/Modal'
import Button from '../../../common/Button'
import Alert from '../../../common/Alert'
import type { UserEnablementAction } from '../../../../types/users.types'

export interface EnableOrDisableUserModalProps {
  /** 'enable' cuando el usuario está deshabilitado, 'disable' cuando está
   * habilitado: define tanto el texto de confirmación como el endpoint que
   * consume el container. */
  action: UserEnablementAction
  userName: string
  isSubmitting: boolean
  errorMessage?: string
  onClose: () => void
  onConfirm: () => void
}

// Modal de confirmación único para habilitar/deshabilitar un usuario desde la
// grilla. El texto (título, mensaje, botón) y el endpoint que dispara el
// container dependen de `action`.
function EnableOrDisableUserModal({
  action,
  userName,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: EnableOrDisableUserModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen
      onClose={onClose}
      closeLabel={t('common.modal.close')}
      title={t(`users.enableOrDisableModal.${action}.title`)}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text">
          {t(`users.enableOrDisableModal.${action}.message`, { name: userName })}
        </p>

        {errorMessage && <Alert variant="warning">{errorMessage}</Alert>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('users.enableOrDisableModal.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? t(`users.enableOrDisableModal.${action}.confirming`)
              : t(`users.enableOrDisableModal.${action}.confirm`)}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EnableOrDisableUserModal
