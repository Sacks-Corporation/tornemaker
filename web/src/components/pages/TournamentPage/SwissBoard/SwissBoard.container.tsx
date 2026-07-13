import { useTranslation } from 'react-i18next'
import SwissBoard from './SwissBoard'
import type { SwissMatchCardView, SwissRoundView, SwissTeamCardView } from './SwissBoard'
import { getTeamName, getTeamPlayerNames } from '../../../../utils/tournament.utils'
import type { Match, SwissStage, TournamentTeam } from '../../../../types/tournament.types'

export interface SwissBoardContainerProps {
  swissStage: SwissStage
  teamMap: Map<string, TournamentTeam>
}

// Arma las vistas del tablero suizo a partir de `SwissStage`: resuelve
// nombre/jugadores por teamId y el récord/estado (isQualified/isEliminated)
// directamente de `participants` (lookup de presentación, no cálculo). Los
// goles y el ganador salen tal cual del match (legs[0] y winnerTeamId, ambos
// provistos por el back). El borde verde/rojo se pinta SOLO en el partido
// que selló la clasificación/eliminación (participant.decidedInMatchId,
// también provisto por el back).
function SwissBoardContainer({ swissStage, teamMap }: SwissBoardContainerProps) {
  const { t } = useTranslation()
  const placeholder = t('tournament.tournamentPage.placeholderTeam')
  const participantMap = new Map(swissStage.participants.map((participant) => [participant.teamId, participant]))

  const buildTeamCard = (
    teamId: string | undefined,
    matchId: string,
    goals: number | null,
    isWinner: boolean,
  ): SwissTeamCardView => {
    const participant = teamId ? participantMap.get(teamId) : undefined
    const isDecisiveMatch = participant?.decidedInMatchId === matchId
    return {
      name: getTeamName(teamMap, teamId, placeholder),
      playerNames: getTeamPlayerNames(teamMap, teamId),
      record: participant
        ? t('tournament.tournamentPage.swissBoard.record', {
            wins: participant.wins,
            losses: participant.losses,
          })
        : '',
      isQualified: (participant?.isQualified ?? false) && isDecisiveMatch,
      isEliminated: (participant?.isEliminated ?? false) && isDecisiveMatch,
      goals,
      isWinner,
    }
  }

  const buildMatchCard = (match: Match): SwissMatchCardView => {
    const isPlayed = match.status !== 'SCHEDULED'
    const leg = match.legs[0]
    const wentToPenalties = isPlayed && (leg?.wentToPenalties ?? false)
    const winnerName =
      wentToPenalties && match.winnerTeamId
        ? getTeamName(teamMap, match.winnerTeamId, placeholder)
        : undefined

    return {
      matchId: match.matchId,
      home: buildTeamCard(
        match.homeTeamId,
        match.matchId,
        isPlayed && leg ? leg.homeGoals : null,
        isPlayed && match.winnerTeamId !== undefined && match.winnerTeamId === match.homeTeamId,
      ),
      away: buildTeamCard(
        match.awayTeamId,
        match.matchId,
        isPlayed && leg ? leg.awayGoals : null,
        isPlayed && match.winnerTeamId !== undefined && match.winnerTeamId === match.awayTeamId,
      ),
      penaltiesLabel: winnerName
        ? t('tournament.tournamentPage.swissBoard.penalties', { team: winnerName })
        : undefined,
    }
  }

  const rounds: SwissRoundView[] = swissStage.rounds.map((round) => ({
    roundNumber: round.roundNumber,
    matches: round.matches.map(buildMatchCard),
  }))

  const playIn = swissStage.playIn.map(buildMatchCard)

  return <SwissBoard rounds={rounds} playIn={playIn} />
}

export default SwissBoardContainer
