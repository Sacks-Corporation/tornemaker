import GroupStagePanel from './GroupStagePanel'
import type { GroupStagePanelProps } from './GroupStagePanel'

// Componente puramente presentacional: el container reenvía las props tal cual.
function GroupStagePanelContainer(props: GroupStagePanelProps) {
  return <GroupStagePanel {...props} />
}

export default GroupStagePanelContainer
export type { GroupStagePanelProps }
