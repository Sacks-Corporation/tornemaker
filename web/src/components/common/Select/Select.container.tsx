import Select from './Select'
import type { SelectProps } from './Select'

// Componente puramente presentacional: el container reenvía las props tal cual.
function SelectContainer<T extends string = string>(props: SelectProps<T>) {
  return <Select {...props} />
}

export default SelectContainer
export type { SelectProps }
