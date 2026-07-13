import LeagueStagePanel from './LeagueStagePanel'
import type { LeagueStagePanelProps } from './LeagueStagePanel'

// Componente puramente presentacional: el container reenvía las props tal cual.
function LeagueStagePanelContainer(props: LeagueStagePanelProps) {
  return <LeagueStagePanel {...props} />
}

export default LeagueStagePanelContainer
export type { LeagueStagePanelProps }
