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
