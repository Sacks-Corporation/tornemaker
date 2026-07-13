import Tabs from './Tabs'
import type { TabItem, TabsProps } from './Tabs'

// Componente puramente presentacional: el container reenvía las props tal cual.
function TabsContainer<T extends string = string>(props: TabsProps<T>) {
  return <Tabs {...props} />
}

export default TabsContainer
export type { TabItem, TabsProps }
