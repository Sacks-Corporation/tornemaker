import RadioGroup from './RadioGroup'
import type { RadioGroupProps } from './RadioGroup'

// Componente puramente presentacional: el container reenvía las props tal cual.
function RadioGroupContainer<T extends string = string>(props: RadioGroupProps<T>) {
  return <RadioGroup {...props} />
}

export default RadioGroupContainer
export type { RadioGroupProps }
