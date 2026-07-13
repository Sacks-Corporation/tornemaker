import { useTranslation } from 'react-i18next'

export interface SwissTeamCardView {
  name: string
  playerNames: string[]
  record: string
  // Solo true en la card del partido que selló la clasificación/eliminación
  // (el container las apaga en el resto de las apariciones del equipo).
  isQualified: boolean
  isEliminated: boolean
  // Goles de este equipo en el partido (null si todavía no se jugó).
  goals: number | null
  isWinner: boolean
}

export interface SwissMatchCardView {
  matchId: string
  home: SwissTeamCardView
  away: SwissTeamCardView
  // Texto tipo "Penales: ganó X" cuando el partido se definió por penales.
  penaltiesLabel?: string
}

export interface SwissRoundView {
  roundNumber: number
  matches: SwissMatchCardView[]
}

export interface SwissBoardProps {
  rounds: SwissRoundView[]
  playIn: SwissMatchCardView[]
}

function SwissTeamRow({ team }: { team: SwissTeamCardView }) {
  const borderClass = team.isEliminated
    ? 'border-red-500'
    : team.isQualified
      ? 'border-green-500'
      : 'border-border'

  return (
    <div className={['flex items-center gap-2 rounded-md border-2 p-2', borderClass].join(' ')}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text">{team.name}</span>
          {team.record && (
            <span className="shrink-0 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
              {team.record}
            </span>
          )}
        </div>
        {team.playerNames.length > 0 && (
          <span className="truncate text-xs text-text-muted">{team.playerNames.join(', ')}</span>
        )}
      </div>
      {team.goals !== null && (
        <span
          className={[
            'shrink-0 text-lg font-bold tabular-nums',
            team.isWinner ? 'text-primary' : 'text-text-muted',
          ].join(' ')}
        >
          {team.goals}
        </span>
      )}
    </div>
  )
}

function SwissMatchCard({ match }: { match: SwissMatchCardView }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2">
      <SwissTeamRow team={match.home} />
      <SwissTeamRow team={match.away} />
      {match.penaltiesLabel && (
        <div className="text-center text-xs font-medium text-text-muted">{match.penaltiesLabel}</div>
      )}
    </div>
  )
}

// Tablero de la fase suiza: columnas por ronda avanzando a la derecha, cada
// una con sus emparejamientos. Borde rojo/verde solo en el partido que
// confirmó la eliminación/clasificación del equipo (dato directo de
// `participants.decidedInMatchId`, no calculado acá). Los goles del partido
// se muestran en la fila de cada equipo, con el ganador resaltado. Incluye
// columna de play-in si corresponde. Scroll horizontal propio en mobile.
function SwissBoard({ rounds, playIn }: SwissBoardProps) {
  const { t } = useTranslation()

  if (rounds.length === 0 && playIn.length === 0) {
    return <p className="text-sm text-text-muted">{t('tournament.tournamentPage.swissBoard.empty')}</p>
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-6 pb-2">
        {rounds.map((round) => (
          <div key={round.roundNumber} className="flex w-64 shrink-0 flex-col gap-4">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t('tournament.tournamentPage.swissBoard.roundTitle', { number: round.roundNumber })}
            </h3>
            <div className="flex flex-col gap-4">
              {round.matches.map((match) => (
                <SwissMatchCard key={match.matchId} match={match} />
              ))}
            </div>
          </div>
        ))}

        {playIn.length > 0 && (
          <div className="flex w-64 shrink-0 flex-col gap-4">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t('tournament.tournamentPage.swissBoard.playInTitle')}
            </h3>
            <div className="flex flex-col gap-4">
              {playIn.map((match) => (
                <SwissMatchCard key={match.matchId} match={match} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SwissBoard
