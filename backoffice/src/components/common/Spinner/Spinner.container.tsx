import Spinner from './Spinner'
import type { SpinnerProps, SpinnerSize } from './Spinner'

// Componente puramente presentacional: el container reenvía las props tal cual.
function SpinnerContainer(props: SpinnerProps) {
  return <Spinner {...props} />
}

export default SpinnerContainer
export type { SpinnerProps, SpinnerSize }
