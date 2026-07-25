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
  /** `EnableOrDisableUserModal` ya armado por el container cuando hay un
   * usuario seleccionado para togglear, `null` si no hay ninguno abierto. */
  modal?: ReactNode
}

// Ícono de la acción "Habilitar" (fila con `enabled: false`), usado en la
// columna de acciones armada en el container.
export function EnableUserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// Ícono de la acción "Deshabilitar" (fila con `enabled: true`), usado en la
// columna de acciones armada en el container.
export function DisableUserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
        clipRule="evenodd"
      />
    </svg>
  )
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

function UsersPage({ title, subtitle, tableContainerRef, table, modal }: UsersPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        <p className="text-sm text-text-muted">{subtitle}</p>
      </header>

      <div ref={tableContainerRef}>{table}</div>

      {modal}
    </div>
  )
}

export default UsersPage
