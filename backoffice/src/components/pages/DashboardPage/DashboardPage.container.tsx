import { useTranslation } from 'react-i18next'
import DashboardPage from './DashboardPage'
import type { DashboardPageProps } from './DashboardPage'

function DashboardPageContainer() {
  const { t } = useTranslation()

  return (
    <DashboardPage
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      placeholder={t('dashboard.placeholder')}
    />
  )
}

export default DashboardPageContainer
export type { DashboardPageProps }
