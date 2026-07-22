import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from '../Logo'
import type { ThemeMode } from '../../../types/common.types'

export interface SidebarNavItem {
  id: string
  /** Label ya traducido (lo resuelve el container). */
  label: string
  path: string
  icon: ReactNode
  /** `true` para que solo matchee la ruta exacta (ej: '/'). */
  end?: boolean
}

export interface SidebarProps {
  title: string
  subtitle: string
  navLabel: string
  items: SidebarNavItem[]
  theme: ThemeMode
  themeToggleLabel: string
  onToggleTheme: () => void
  logoutLabel: string
  onLogout: () => void
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1Zm0 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1ZM3.515 3.515a1 1 0 0 1 1.414 0L6.343 4.93A1 1 0 0 1 4.93 6.343L3.515 4.93a1 1 0 0 1 0-1.414Zm14.142 14.142a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 0-1.414ZM1 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1Zm18 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1ZM6.343 17.657a1 1 0 0 1 0 1.414L4.93 20.485a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0ZM20.485 3.515a1 1 0 0 1 0 1.414L19.07 6.343a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0Z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M21.64 13.65A9 9 0 1 1 10.35 2.36a1 1 0 0 1 1.27 1.27A7 7 0 0 0 20.37 12.38a1 1 0 0 1 1.27 1.27Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M10 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5H5v14h4v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5Zm7.29 5.29 3.42 3.42a1 1 0 0 1 0 1.42l-3.42 3.42a1 1 0 0 1-1.42-1.42L17.59 13H10a1 1 0 1 1 0-2h7.59l-1.72-1.71a1 1 0 0 1 1.42-1.42Z" />
    </svg>
  )
}

// Sidebar vertical fijo a la izquierda: marca, navegación y toggle de tema.
// En pantallas chicas colapsa a solo íconos; desde `lg` muestra los labels.
function Sidebar({
  title,
  subtitle,
  navLabel,
  items,
  theme,
  themeToggleLabel,
  onToggleTheme,
  logoutLabel,
  onLogout,
}: SidebarProps) {
  return (
    <aside
      aria-label={title}
      className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-border bg-sidebar lg:w-60"
    >
      {/* Marca */}
      <div className="flex items-center justify-center gap-3 px-3 py-5 lg:justify-start lg:px-5">
        {/* Ícono solo, para el sidebar colapsado (solo íconos, sin espacio para el wordmark) */}
        <Logo variant="icon" className="h-9 w-9 shrink-0 lg:hidden" />

        {/* Wordmark completo + subtítulo, para el sidebar expandido */}
        <div className="hidden min-w-0 flex-col items-start gap-1 lg:flex">
          <Logo variant="lockup" className="h-7 w-auto" />
          <span className="truncate text-xs text-text-muted">{subtitle}</span>
        </div>
      </div>

      {/* Navegación */}
      <nav aria-label={navLabel} className="flex-1 overflow-y-auto px-2 py-2 lg:px-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors duration-150 lg:justify-start lg:px-3',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive
                      ? 'bg-primary/15 text-primary-hover'
                      : 'text-text-muted hover:bg-primary/10 hover:text-text',
                  ].join(' ')
                }
              >
                <span className="shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="hidden truncate lg:inline">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Cerrar sesión y toggle de tema */}
      <div className="flex flex-col gap-1 border-t border-border p-2 lg:p-3">
        <button
          type="button"
          onClick={onLogout}
          aria-label={logoutLabel}
          title={logoutLabel}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:justify-start lg:px-3"
        >
          <LogoutIcon />
          <span className="hidden truncate lg:inline">{logoutLabel}</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:justify-start lg:px-3"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          <span className="hidden truncate lg:inline">{themeToggleLabel}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
