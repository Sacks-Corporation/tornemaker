import { useTranslation } from 'react-i18next'
import TiebreakMatchesList from './TiebreakMatchesList'
import type { TiebreakMatchView } from './TiebreakMatchesList'
import { formatMatchScoreLabel, getTeamName } from '../../../../utils/tournament.utils'
import type { Match, TournamentTeam } from '../../../../types/tournament.types'

export interface TiebreakMatchesListContainerProps {
  matches: Match[]
  teamMap: Map<string, TournamentTeam>
}

function TiebreakMatchesListContainer({ matches, teamMap }: TiebreakMatchesListContainerProps) {
  const { t } = useTranslation()
  const placeholder = t('tournament.tournamentPage.placeholderTeam')

  const rows: TiebreakMatchView[] = matches.map((match) => ({
    matchId: match.matchId,
    homeName: getTeamName(teamMap, match.homeTeamId, placeholder),
    awayName: getTeamName(teamMap, match.awayTeamId, placeholder),
    scoreLabel: formatMatchScoreLabel(match),
  }))

  return <TiebreakMatchesList title={t('tournament.tournamentPage.standings.tiebreakTitle')} matches={rows} />
}

export default TiebreakMatchesListContainer
