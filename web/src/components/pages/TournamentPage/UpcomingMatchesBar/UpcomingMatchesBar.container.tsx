import { useTranslation } from 'react-i18next'
import UpcomingMatchesBar from './UpcomingMatchesBar'
import type { UpcomingMatchCardView } from './UpcomingMatchesBar'
import { getTeamName, isTwoLeggedPhase } from '../../../../utils/tournament.utils'
import type { TournamentDetail, TournamentTeam, UpcomingMatch } from '../../../../types/tournament.types'

export interface UpcomingMatchesBarContainerProps {
  tournament: TournamentDetail
  upcomingMatches: UpcomingMatch[]
  teamMap: Map<string, TournamentTeam>
  onSelectMatch: (match: UpcomingMatch) => void
  onResetClick: () => void
}

// Arma las cards de próximos partidos a partir de GET /matches: solo
// traduce fase/consola y decide si corresponde la etiqueta Ida/Vuelta,
// resolviendo el resultado de la ida cuando aplica (legNumber 2).
function UpcomingMatchesBarContainer({
  tournament,
  upcomingMatches,
  teamMap,
  onSelectMatch,
  onResetClick,
}: UpcomingMatchesBarContainerProps) {
  const { t } = useTranslation()
  const placeholder = t('tournament.tournamentPage.placeholderTeam')

  const matchesById = new Map(upcomingMatches.map((match) => [match.matchId, match]))

  const cards: UpcomingMatchCardView[] = upcomingMatches.map((match) => {
    const isTwoLegged = match.legNumber === 2 || isTwoLeggedPhase(tournament, match.phase)

    return {
      matchId: match.matchId,
      phaseLabel: t(`tournament.tournamentPage.phases.${match.phase}`),
      roundLabel: match.roundLabel,
      groupLabel: match.groupName,
      legLabel: isTwoLegged
        ? match.legNumber === 1
          ? t('tournament.tournamentPage.upcomingBar.legFirst')
          : t('tournament.tournamentPage.upcomingBar.legSecond')
        : undefined,
      homeName: match.homeTeam.name || placeholder,
      homePlayers: match.homeTeam.playerNames,
      awayName: match.awayTeam.name || placeholder,
      awayPlayers: match.awayTeam.playerNames,
      consoleLabel: t('tournament.tournamentPage.upcomingBar.console', {
        console: t(`tournament.consoleTypes.${match.assignedConsole}`),
      }),
      firstLegResultLabel: match.firstLegResult
        ? t('tournament.tournamentPage.upcomingBar.firstLegResult', {
            home: match.firstLegResult.homeGoals,
            away: match.firstLegResult.awayGoals,
          })
        : undefined,
    }
  })

  const isFinished = tournament.state === 'FINISHED'

  // El campeón sale del bracket (championTeamId). LEAGUE no tiene bracket: en
  // ese caso se usa el primer puesto de la tabla, ya ordenada por el back
  // (lookup del rank 1, no un cálculo de posiciones).
  const championTeamId =
    tournament.knockoutStage?.bracket.championTeamId ??
    (tournament.format === 'LEAGUE'
      ? (tournament.leagueStage?.standings.find((standing) => standing.rank === 1)?.teamId ??
        tournament.leagueStage?.standings[0]?.teamId)
      : undefined)

  const championName = championTeamId ? getTeamName(teamMap, championTeamId, placeholder) : undefined

  const handleSelectMatch = (matchId: string) => {
    const match = matchesById.get(matchId)
    if (match) onSelectMatch(match)
  }

  return (
    <UpcomingMatchesBar
      matches={cards}
      isFinished={isFinished}
      championName={championName}
      onSelectMatch={handleSelectMatch}
      onResetClick={onResetClick}
    />
  )
}

export default UpcomingMatchesBarContainer
