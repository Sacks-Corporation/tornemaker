import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import HomePage from './HomePage'
import { useAuth } from '../../../hooks/auth/AuthContext'

function HomePageContainer() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const ctaLabel = isAuthenticated
    ? t('home.cta.createTournament')
    : t('home.cta.loginToCreate')

  const handleCtaClick = () => {
    navigate(isAuthenticated ? '/new' : '/login')
  }

  return <HomePage ctaLabel={ctaLabel} onCtaClick={handleCtaClick} />
}

export default HomePageContainer
