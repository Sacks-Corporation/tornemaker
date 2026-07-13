import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../../common/Button'

export interface UpcomingMatchCardView {
  matchId: string
  phaseLabel: string
  roundLabel: string
  groupLabel?: string
  legLabel?: string
  homeName: string
  homePlayers: string[]
  awayName: string
  awayPlayers: string[]
  consoleLabel: string
  firstLegResultLabel?: string
}

export interface UpcomingMatchesBarProps {
  matches: UpcomingMatchCardView[]
  isFinished: boolean
  championName?: string
  onSelectMatch: (matchId: string) => void
  onResetClick: () => void
}

function MatchCard({
  match,
  onSelect,
}: {
  match: UpcomingMatchCardView
  onSelect: (matchId: string) => void
}) {
  const { t } = useTranslation()

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(match.matchId)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(match.matchId)}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer flex-col gap-2 rounded-2xl border-2 border-border bg-surface p-4 text-left transition-colors duration-150 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <span>
          {match.phaseLabel} · {match.roundLabel}
          {match.groupLabel ? ` · ${match.groupLabel}` : ''}
        </span>
        {match.legLabel && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{match.legLabel}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div>
          <p className="font-semibold text-text">{match.homeName}</p>
          {match.homePlayers.length > 0 && (
            <p className="text-xs text-text-muted">{match.homePlayers.join(', ')}</p>
          )}
        </div>
        <p className="text-xs font-medium text-text-muted">vs</p>
        <div>
          <p className="font-semibold text-text">{match.awayName}</p>
          {match.awayPlayers.length > 0 && (
            <p className="text-xs text-text-muted">{match.awayPlayers.join(', ')}</p>
          )}
        </div>
      </div>

      {match.firstLegResultLabel && (
        <p className="text-xs text-text-muted">{match.firstLegResultLabel}</p>
      )}

      <p className="text-xs font-medium text-text-muted">{match.consoleLabel}</p>

      <span className="mt-1 self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">
        {t('tournament.tournamentPage.upcomingBar.loadResult')}
      </span>
    </div>
  )
}

// Barra superior, siempre visible, con los próximos partidos jugables (todos
// en simultáneo, en consolas distintas). Click en una card abre el modal de
// carga de resultado.
function UpcomingMatchesBar({
  matches,
  isFinished,
  championName,
  onSelectMatch,
  onResetClick,
}: UpcomingMatchesBarProps) {
  const { t } = useTranslation()

  return (
    <section className="w-full border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('tournament.tournamentPage.upcomingBar.title')}
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onResetClick}
            className="self-start sm:self-auto"
          >
            {t('tournament.tournamentPage.upcomingBar.resetButton')}
          </Button>
        </div>

        {isFinished ? (
          <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4 text-center">
            <p className="text-base font-semibold text-text">{t('tournament.tournamentPage.finished.title')}</p>
            {championName && (
              <p className="text-sm text-text-muted">
                {t('tournament.tournamentPage.finished.champion', { team: championName })}
              </p>
            )}
          </div>
        ) : matches.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-4 text-center text-sm text-text-muted">
            {t('tournament.tournamentPage.upcomingBar.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.matchId} match={match} onSelect={onSelectMatch} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default UpcomingMatchesBar
