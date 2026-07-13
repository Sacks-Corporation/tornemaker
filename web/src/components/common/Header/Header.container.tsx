import { useTranslation } from 'react-i18next'
import Header from './Header'
import { useTheme } from '../../../hooks/common/useTheme'
import { useAuth } from '../../../hooks/auth/AuthContext'

function HeaderContainer() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()

  const toggleThemeLabel =
    theme === 'dark' ? t('common.header.toggleThemeToLight') : t('common.header.toggleThemeToDark')

  const userDisplayName = user ? `${user.firstName} ${user.lastName}`.trim() : null

  return (
    <Header
      theme={theme}
      toggleThemeLabel={toggleThemeLabel}
      onToggleTheme={toggleTheme}
      isAuthenticated={isAuthenticated}
      userDisplayName={userDisplayName}
      loginLabel={t('auth.session.loginCta')}
      logoutLabel={t('auth.session.logoutCta')}
      onLogout={logout}
    />
  )
}

export default HeaderContainer
