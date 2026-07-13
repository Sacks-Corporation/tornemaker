import { useTranslation } from 'react-i18next'
import KnockoutBracket from './KnockoutBracket'
import type { BracketMatchCardView, BracketRoundView, BracketTeamCardView } from './KnockoutBracket'
import { getTeamName, getTeamPlayerNames } from '../../../../utils/tournament.utils'
import type { Bracket, Match, TournamentTeam } from '../../../../types/tournament.types'

export interface KnockoutBracketContainerProps {
  bracket: Bracket
  teamMap: Map<string, TournamentTeam>
}

// Arma las vistas de bracket a partir de `Bracket` (rounds, thirdPlaceMatch,
// championTeamId): resuelve nombres/jugadores por teamId (lookup de
// presentación) y quién avanza (`winnerTeamId`, ya provisto por el back).
function KnockoutBracketContainer({ bracket, teamMap }: KnockoutBracketContainerProps) {
  const { t } = useTranslation()
  const placeholder = t('tournament.tournamentPage.placeholderTeam')
  const firstLegLabel = t('tournament.tournamentPage.bracket.leg.first')
  const secondLegLabel = t('tournament.tournamentPage.bracket.leg.second')

  const buildTeamView = (teamId: string | undefined, winnerTeamId: string | undefined): BracketTeamCardView => ({
    name: getTeamName(teamMap, teamId, placeholder),
    playerNames: getTeamPlayerNames(teamMap, teamId),
    isWinner: Boolean(teamId) && teamId === winnerTeamId,
    isPlaceholder: !teamId,
  })

  const buildMatchCard = (match: Match): BracketMatchCardView => ({
    matchId: match.matchId,
    home: buildTeamView(match.homeTeamId, match.winnerTeamId),
    away: buildTeamView(match.awayTeamId, match.winnerTeamId),
    legScores: match.legs.map((leg, index) => ({
      label: match.isTwoLegged ? (index === 0 ? firstLegLabel : secondLegLabel) : '',
      homeGoals: leg.homeGoals,
      awayGoals: leg.awayGoals,
    })),
    wentToPenalties: match.legs.some((leg) => leg.wentToPenalties),
    isWalkover: match.status === 'WALKOVER',
    isPlayed: match.status !== 'SCHEDULED',
  })

  const rounds: BracketRoundView[] = bracket.rounds.map((round) => ({
    roundNumber: round.roundNumber,
    name: round.name,
    matches: round.matches.map(buildMatchCard),
  }))

  const championName = bracket.championTeamId
    ? getTeamName(teamMap, bracket.championTeamId, placeholder)
    : undefined

  const thirdPlaceMatch = bracket.thirdPlaceMatch ? buildMatchCard(bracket.thirdPlaceMatch) : undefined

  return <KnockoutBracket rounds={rounds} thirdPlaceMatch={thirdPlaceMatch} championName={championName} />
}

export default KnockoutBracketContainer
