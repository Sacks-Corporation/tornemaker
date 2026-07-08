import RadioButton from './RadioButton'
import type { RadioButtonProps } from './RadioButton'

// Componente puramente presentacional: el container reenvía las props tal cual.
function RadioButtonContainer(props: RadioButtonProps) {
  return <RadioButton {...props} />
}

export default RadioButtonContainer
export type { RadioButtonProps }
