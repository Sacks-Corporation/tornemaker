import Switch from './Switch'
import type { SwitchProps } from './Switch'

// Componente puramente presentacional: el container reenvía las props tal cual.
function SwitchContainer(props: SwitchProps) {
  return <Switch {...props} />
}

export default SwitchContainer
export type { SwitchProps }
