import type { KeyboardEvent, MouseEvent } from 'react'
import type { TournamentStatus } from '../../../types/tournament.types'

export interface TournamentCardProps {
  name: string
  formatLabel: string
  status: TournamentStatus
  statusLabel: string
  teamCountLabel: string
  dateLabel: string
  onClick: () => void
}

const statusClasses: Record<TournamentStatus, string> = {
  EN_PROGRESO: 'border-primary/40 bg-primary/10 text-primary',
  TERMINADO: 'border-border bg-surface text-text-muted',
}

// Card clickeable que resume un torneo guardado (listado /tournaments). Es un
// <div> interactivo (no un <button>) con role/tabIndex/teclado, siguiendo el
// mismo patrón de accesibilidad que common/Card.
function TournamentCard({
  name,
  formatLabel,
  status,
  statusLabel,
  teamCountLabel,
  dateLabel,
  onClick,
}: TournamentCardProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    onClick()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="flex w-full cursor-pointer flex-col gap-3 rounded-2xl border-2 border-border bg-surface p-4 text-left transition-all duration-150 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-text sm:text-lg">{name}</h3>
        <span
          className={[
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium',
            statusClasses[status],
          ].join(' ')}
        >
          {statusLabel}
        </span>
      </div>

      <p className="text-sm text-text-muted">{formatLabel}</p>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{teamCountLabel}</span>
        <span>{dateLabel}</span>
      </div>
    </div>
  )
}

export default TournamentCard
