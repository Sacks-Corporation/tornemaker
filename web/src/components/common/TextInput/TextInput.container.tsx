import TextInput from './TextInput'
import type { TextInputProps } from './TextInput'

// Componente puramente presentacional: el container reenvía las props tal cual.
function TextInputContainer(props: TextInputProps) {
  return <TextInput {...props} />
}

export default TextInputContainer
export type { TextInputProps }
