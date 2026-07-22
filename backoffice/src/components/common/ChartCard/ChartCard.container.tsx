import ChartCard from './ChartCard'
import type { ChartCardProps } from './ChartCard'

// Componente puramente presentacional: el container reenvía las props tal cual.
function ChartCardContainer(props: ChartCardProps) {
  return <ChartCard {...props} />
}

export default ChartCardContainer
export type { ChartCardProps }
