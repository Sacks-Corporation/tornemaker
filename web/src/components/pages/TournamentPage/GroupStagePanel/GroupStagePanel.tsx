import StandingsTable from '../StandingsTable'
import TiebreakMatchesList from '../TiebreakMatchesList'
import type { Group, TournamentTeam } from '../../../../types/tournament.types'

export interface GroupStagePanelProps {
  groups: Group[]
  teamMap: Map<string, TournamentTeam>
}

// Tab "Fase de grupos" de GROUP_STAGE_PLUS_ELIMINATION: todas las tablas de
// grupo juntas en un grid responsive, cada una con sus partidos de desempate.
function GroupStagePanel({ groups, teamMap }: GroupStagePanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {groups.map((group) => (
        <div key={group.name} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
          <StandingsTable caption={group.name} standings={group.standings} teamMap={teamMap} />
          <TiebreakMatchesList matches={group.tiebreakMatches} teamMap={teamMap} />
        </div>
      ))}
    </div>
  )
}

export default GroupStagePanel
