import Button from './Button'
import type { ButtonProps } from './Button'

// Componente puramente presentacional: el container reenvía las props tal cual.
function ButtonContainer(props: ButtonProps) {
  return <Button {...props} />
}

export default ButtonContainer
export type { ButtonProps }
