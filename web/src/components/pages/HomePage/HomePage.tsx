import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Button from '../../common/Button'
import Logo from '../../common/Logo'

export interface HomePageProps {
  ctaLabel: string
  onCtaClick: () => void
  viewTournamentsLabel: string
  onViewTournamentsClick: () => void
}

function HomePage({
  ctaLabel,
  onCtaClick,
  viewTournamentsLabel,
  onViewTournamentsClick,
}: HomePageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <Logo variant="lockup" className="mb-4 h-14 sm:h-16" />
          <h1 className="text-3xl font-bold text-text sm:text-4xl lg:text-5xl">{t('home.title')}</h1>
          <p className="mt-4 max-w-2xl text-base text-text-muted sm:text-lg lg:text-xl">
            {t('home.subtitle')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button type="button" variant="primary" size="lg" onClick={onCtaClick}>
            {ctaLabel}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={onViewTournamentsClick}>
            {viewTournamentsLabel}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default HomePage
