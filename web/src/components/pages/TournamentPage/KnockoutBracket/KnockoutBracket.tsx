import { useTranslation } from 'react-i18next'

export interface BracketTeamCardView {
  name: string
  playerNames: string[]
  isWinner: boolean
  isPlaceholder: boolean
}

export interface BracketLegScoreView {
  label: string
  homeGoals: number
  awayGoals: number
}

export interface BracketMatchCardView {
  matchId: string
  home: BracketTeamCardView
  away: BracketTeamCardView
  legScores: BracketLegScoreView[]
  wentToPenalties: boolean
  isWalkover: boolean
  isPlayed: boolean
}

export interface BracketRoundView {
  roundNumber: number
  name: string
  matches: BracketMatchCardView[]
}

export interface KnockoutBracketProps {
  rounds: BracketRoundView[]
  thirdPlaceMatch?: BracketMatchCardView
  championName?: string
}

function TeamRow({
  team,
  scores,
  showScores,
}: {
  team: BracketTeamCardView
  scores: number[]
  showScores: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col">
        <span
          className={[
            'truncate text-sm',
            team.isWinner ? 'font-semibold text-primary' : team.isPlaceholder ? 'italic text-text-muted' : 'text-text',
          ].join(' ')}
        >
          {team.name}
        </span>
        {team.playerNames.length > 0 && (
          <span className="truncate text-xs text-text-muted">{team.playerNames.join(', ')}</span>
        )}
      </div>
      {showScores && (
        <div className="flex shrink-0 gap-1">
          {scores.map((score, index) => (
            <span key={index} className="min-w-[1.25rem] text-center text-sm font-semibold text-text">
              {score}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function BracketMatchCard({ match }: { match: BracketMatchCardView }) {
  const { t } = useTranslation()
  const showLegLabels = match.legScores.length > 1 && match.legScores.some((leg) => leg.label)

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
      {showLegLabels && (
        <div className="flex justify-end gap-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {match.legScores.map((leg, index) => (
            <span key={index} className="min-w-[1.25rem] text-center">
              {leg.label}
            </span>
          ))}
        </div>
      )}

      <TeamRow
        team={match.home}
        scores={match.legScores.map((leg) => leg.homeGoals)}
        showScores={match.isPlayed}
      />
      <div className="h-px bg-border" />
      <TeamRow
        team={match.away}
        scores={match.legScores.map((leg) => leg.awayGoals)}
        showScores={match.isPlayed}
      />

      {(match.wentToPenalties || match.isWalkover) && (
        <div className="flex flex-wrap gap-1 pt-1">
          {match.wentToPenalties && (
            <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {t('tournament.tournamentPage.bracket.penalties')}
            </span>
          )}
          {match.isWalkover && (
            <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {t('tournament.tournamentPage.bracket.walkover')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Bracket de eliminación directa: columnas por ronda avanzando a la derecha
// (usa `round.name` como título de columna). Se reutiliza tal cual en
// SINGLE_ELIMINATION, GROUP_STAGE_PLUS_ELIMINATION y SWISS_PLUS_ELIMINATION.
// Sin escudos/logos: nombre de equipo + jugadores debajo. Scroll horizontal
// propio en pantallas chicas.
function KnockoutBracket({ rounds, thirdPlaceMatch, championName }: KnockoutBracketProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max items-stretch gap-6 pb-2">
        {rounds.map((round) => (
          <div key={round.roundNumber} className="flex w-64 shrink-0 flex-col gap-4">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wide text-text-muted">
              {round.name}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {round.matches.map((match) => (
                <BracketMatchCard key={match.matchId} match={match} />
              ))}
            </div>
          </div>
        ))}

        {championName && (
          <div className="flex w-64 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary/10 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t('tournament.tournamentPage.bracket.championTitle')}
            </span>
            <span className="text-lg font-bold text-text">{championName}</span>
          </div>
        )}
      </div>

      {thirdPlaceMatch && (
        <div className="mt-6 flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('tournament.tournamentPage.bracket.thirdPlaceTitle')}
          </h3>
          <div className="w-64">
            <BracketMatchCard match={thirdPlaceMatch} />
          </div>
        </div>
      )}
    </div>
  )
}

export default KnockoutBracket
