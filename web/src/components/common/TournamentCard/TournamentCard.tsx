import type { KeyboardEvent, MouseEvent } from 'react'
import type { TournamentStatus } from '../../../types/tournament.types'

export interface TournamentCardProps {
  name: string
  formatLabel: string
  status: TournamentStatus
  statusLabel: string
  teamCountLabel: string
  dateLabel: string
  deleteLabel: string
  onClick: () => void
  onDelete: () => void
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
  deleteLabel,
  onClick,
  onDelete,
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

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    // La card entera es clickeable (navega al detalle); el botón de borrar
    // vive adentro, así que hay que frenar la propagación para no navegar.
    event.stopPropagation()
    event.preventDefault()
    onDelete()
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

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium',
              statusClasses[status],
            ].join(' ')}
          >
            {statusLabel}
          </span>

          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label={deleteLabel}
            title={deleteLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:bg-red-600/10 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1a.75.75 0 0 0-.75.75V3H4.5a.75.75 0 0 0 0 1.5h.394l.812 10.556A2 2 0 0 0 7.7 17h4.6a2 2 0 0 0 1.994-1.944L15.106 4.5H15.5a.75.75 0 0 0 0-1.5H12v-1.25a.75.75 0 0 0-.75-.75h-2.5ZM8.5 7.25a.75.75 0 0 1 1.5 0v6.5a.75.75 0 0 1-1.5 0v-6.5Zm3.5 0a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
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
