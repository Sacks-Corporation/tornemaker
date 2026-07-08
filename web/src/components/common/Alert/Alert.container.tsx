import Alert from './Alert'
import type { AlertProps, AlertVariant } from './Alert'

// Componente puramente presentacional: el container reenvía las props tal cual.
function AlertContainer(props: AlertProps) {
  return <Alert {...props} />
}

export default AlertContainer
export type { AlertProps, AlertVariant }
