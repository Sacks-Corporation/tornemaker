import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import type { SidebarNavItem, SidebarProps } from './Sidebar'
import { useTheme } from '../../../hooks/common/useTheme'

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

function SidebarContainer() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  // Ítems de navegación del backoffice: agregá acá las páginas nuevas.
  const items: SidebarNavItem[] = [
    {
      id: 'dashboard',
      label: t('common.sidebar.dashboard'),
      path: '/',
      icon: <DashboardIcon />,
      end: true,
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
    />
  )
}

export default SidebarContainer
export type { SidebarNavItem, SidebarProps }
