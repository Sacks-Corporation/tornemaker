import TournamentCard from './TournamentCard'
import type { TournamentCardProps } from './TournamentCard'

// Componente puramente presentacional: el container reenvía las props tal cual.
function TournamentCardContainer(props: TournamentCardProps) {
  return <TournamentCard {...props} />
}

export default TournamentCardContainer
export type { TournamentCardProps }
