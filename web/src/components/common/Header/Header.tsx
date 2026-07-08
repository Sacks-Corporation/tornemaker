import { Link } from 'react-router-dom'
import type { ThemeMode } from '../../../types/common.types'
import Button from '../Button'

export interface HeaderProps {
  siteName: string
  theme: ThemeMode
  toggleThemeLabel: string
  onToggleTheme: () => void
  isAuthenticated: boolean
  userDisplayName: string | null
  loginLabel: string
  logoutLabel: string
  onLogout: () => void
}

function Header({
  siteName,
  theme,
  toggleThemeLabel,
  onToggleTheme,
  isAuthenticated,
  userDisplayName,
  loginLabel,
  logoutLabel,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-header shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-bold tracking-tight text-on-primary sm:text-xl">
          {siteName}
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-sm font-medium text-on-primary sm:inline">
                {userDisplayName}
              </span>
              <Button variant="secondary" size="sm" onClick={onLogout}>
                {logoutLabel}
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="secondary" size="sm">
                {loginLabel}
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={toggleThemeLabel}
            title={toggleThemeLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-on-primary/30 text-on-primary transition-colors duration-150 hover:bg-on-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header"
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M12 4.5a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1.5a1 1 0 0 1-1 1Zm0 15a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM4.5 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1Zm15 0a1 1 0 0 1 1-1H22a1 1 0 1 1 0 2h-1.5a1 1 0 0 1-1-1ZM6.34 6.34a1 1 0 0 1-1.42 0L3.88 5.29a1 1 0 0 1 1.41-1.41l1.05 1.04a1 1 0 0 1 0 1.42Zm11.32 11.32a1 1 0 0 1-1.42 0l-1.04-1.05a1 1 0 0 1 1.41-1.41l1.05 1.04a1 1 0 0 1 0 1.42ZM6.34 17.66l-1.05 1.04a1 1 0 0 1-1.41-1.41l1.04-1.05a1 1 0 1 1 1.42 1.42Zm11.32-11.32-1.04 1.05a1 1 0 1 1-1.41-1.41l1.04-1.05a1 1 0 0 1 1.41 1.41ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.14c0-1.16.23-2.28.68-3.37A1 1 0 0 0 8.4 1.05a10.14 10.14 0 1 0 13.55 13.55 1 1 0 0 0-.31-1.6Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
