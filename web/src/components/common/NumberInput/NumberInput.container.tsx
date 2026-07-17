import NumberInput from './NumberInput'
import type { NumberInputProps } from './NumberInput'

// Componente puramente presentacional: el container reenvía las props tal cual.
function NumberInputContainer(props: NumberInputProps) {
  return <NumberInput {...props} />
}

export default NumberInputContainer
export type { NumberInputProps }
