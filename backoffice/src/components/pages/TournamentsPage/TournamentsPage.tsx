import type { ReactNode, RefObject } from 'react'
import type { TournamentState } from '../../../types/tournaments.types'

export interface TournamentsPageProps {
  title: string
  subtitle: string
  /** Ref del contenedor que envuelve la tabla: lo usa `useAutoPageSize` (en el
   * container) para medir cuánto espacio ya ocupó todo lo que está arriba. */
  tableContainerRef: RefObject<HTMLDivElement | null>
  /** `DataTable` ya armado por el container (es un componente "smart": trae
   * sus propios datos vía `useData`), igual que `Sidebar`/`Footer` en
   * `SidebarLayout`. */
  table: ReactNode
}

const stateBadgeClasses: Record<TournamentState, string> = {
  LEAGUE: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  GROUPS: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  SWISS: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  KNOCKOUTS: 'bg-primary/10 text-primary-hover',
  FINISHED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  DELETED: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

function Badge({ className, label }: { className: string; label: string }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

// Badge de etapa/fase actual del torneo, usado como `render` de la columna
// "Etapa" armada en el container.
export function TournamentStateBadge({
  state,
  label,
}: {
  state: TournamentState
  label: string
}) {
  return <Badge className={stateBadgeClasses[state]} label={label} />
}

function TournamentsPage({ title, subtitle, tableContainerRef, table }: TournamentsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </header>

      <div ref={tableContainerRef}>{table}</div>
    </div>
  )
}

export default TournamentsPage
