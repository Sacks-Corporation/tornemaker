import StandingsTable from '../StandingsTable'
import TiebreakMatchesList from '../TiebreakMatchesList'
import type { Match, Standing, TournamentTeam } from '../../../../types/tournament.types'

export interface LeagueStagePanelProps {
  standings: Standing[]
  tiebreakMatches: Match[]
  teamMap: Map<string, TournamentTeam>
}

// Tab/único contenido del formato LEAGUE: una tabla de posiciones y, si
// existen, los partidos de desempate debajo.
function LeagueStagePanel({ standings, tiebreakMatches, teamMap }: LeagueStagePanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <StandingsTable standings={standings} teamMap={teamMap} />
      <TiebreakMatchesList matches={tiebreakMatches} teamMap={teamMap} />
    </div>
  )
}

export default LeagueStagePanel
