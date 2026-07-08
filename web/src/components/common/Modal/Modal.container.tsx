import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import type { ModalProps } from './Modal'

// El container solo resuelve el label i18n del botón de cerrar por defecto;
// el resto de las props se reenvían tal cual.
function ModalContainer(props: Omit<ModalProps, 'closeLabel'> & { closeLabel?: string }) {
  const { t } = useTranslation()
  return <Modal closeLabel={t('common.modal.close')} {...props} />
}

export default ModalContainer
export type { ModalProps }
