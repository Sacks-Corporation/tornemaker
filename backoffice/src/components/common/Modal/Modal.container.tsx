import Modal from './Modal'
import type { ModalProps } from './Modal'

// Componente puramente presentacional: el container reenvía las props tal cual.
function ModalContainer(props: ModalProps) {
  return <Modal {...props} />
}

export default ModalContainer
export type { ModalProps }
