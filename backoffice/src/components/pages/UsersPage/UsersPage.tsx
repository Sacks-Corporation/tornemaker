import type { ReactNode, RefObject } from 'react'
import type { UserState } from '../../../types/users.types'

export interface UsersPageProps {
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

const stateBadgeClasses: Record<UserState, string> = {
  ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400',
  INACTIVE: 'bg-text-muted/10 text-text-muted',
  BLOCKED: 'bg-red-500/10 text-red-600',
}

// Badge de estado de usuario (Activo/Inactivo/Bloqueado), usado como `render`
// de la columna "Estado" armada en el container.
export function UserStateBadge({ state, label }: { state: UserState; label: string }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        stateBadgeClasses[state],
      ].join(' ')}
    >
      {label}
    </span>
  )
}

function UsersPage({ title, subtitle, tableContainerRef, table }: UsersPageProps) {
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

export default UsersPage
