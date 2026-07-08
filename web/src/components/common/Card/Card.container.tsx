import Card from './Card'
import type { CardProps } from './Card'

// Componente puramente presentacional: el container reenvía las props tal cual.
function CardContainer(props: CardProps) {
  return <Card {...props} />
}

export default CardContainer
export type { CardProps }
