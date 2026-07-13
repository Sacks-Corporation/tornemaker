import { useTranslation } from 'react-i18next'
import StandingsTable from './StandingsTable'
import type { StandingsRowView } from './StandingsTable'
import { getTeamName } from '../../../../utils/tournament.utils'
import type { Standing, TournamentTeam } from '../../../../types/tournament.types'

export interface StandingsTableContainerProps {
  caption?: string
  standings: Standing[]
  teamMap: Map<string, TournamentTeam>
}

function StandingsTableContainer({ caption, standings, teamMap }: StandingsTableContainerProps) {
  const { t } = useTranslation()
  const placeholder = t('tournament.tournamentPage.placeholderTeam')

  const rows: StandingsRowView[] = standings.map((standing) => ({
    teamId: standing.teamId,
    rank: standing.rank,
    teamName: getTeamName(teamMap, standing.teamId, placeholder),
    played: standing.played,
    won: standing.won,
    drawn: standing.drawn,
    lost: standing.lost,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    goalDifference: standing.goalDifference,
    points: standing.points,
  }))

  return <StandingsTable caption={caption} rows={rows} />
}

export default StandingsTableContainer
