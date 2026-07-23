import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import type { SidebarNavItem, SidebarProps } from './Sidebar'
import { useTheme } from '../../../hooks/common/useTheme'
import { useAuth } from '../../../hooks/auth/useAuth'

function DashboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 3h8v10H3V3Zm0 12h8v6H3v-6Zm10-12h8v6h-8V3Zm0 8h8v10h-8V11Z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Zm9-3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-.66 0-1.28.08-1.86.22 1.77 1.1 2.86 2.7 2.86 4.78v1h5v-1c0-2.55-2.86-5-6-5Z" />
    </svg>
  )
}

function TournamentsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 2a1 1 0 0 0-1 1v1H3a1 1 0 0 0-1 1v2a4 4 0 0 0 4 4c.28.66.72 1.24 1.28 1.68A5.02 5.02 0 0 0 11 16.9V19H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.1a5.02 5.02 0 0 0 3.72-2.22A4 4 0 0 0 21 11V7a1 1 0 0 0-1-1h-2V4a1 1 0 0 0-1-1H6ZM5 5v2H4v1a2 2 0 0 0 2 2V5H5Zm14 0h-1v5a2 2 0 0 0 2-2V6h-1V5Z" />
    </svg>
  )
}

function SidebarContainer() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()

  // Ítems de navegación del backoffice: agregá acá las páginas nuevas.
  const items: SidebarNavItem[] = [
    {
      id: 'dashboard',
      label: t('common.sidebar.dashboard'),
      path: '/',
      icon: <DashboardIcon />,
      end: true,
    },
    {
      id: 'users',
      label: t('common.sidebar.users'),
      path: '/users',
      icon: <UsersIcon />,
    },
    {
      id: 'tournaments',
      label: t('common.sidebar.tournaments'),
      path: '/tournaments',
      icon: <TournamentsIcon />,
    },
  ]

  const themeToggleLabel =
    theme === 'dark'
      ? t('common.sidebar.toggleThemeToLight')
      : t('common.sidebar.toggleThemeToDark')

  return (
    <Sidebar
      title={t('common.siteName')}
      subtitle={t('common.appName')}
      navLabel={t('common.sidebar.navLabel')}
      items={items}
      theme={theme}
      themeToggleLabel={themeToggleLabel}
      onToggleTheme={toggleTheme}
      logoutLabel={t('common.sidebar.logout')}
      onLogout={logout}
    />
  )
}

export default SidebarContainer
export type { SidebarNavItem, SidebarProps }
