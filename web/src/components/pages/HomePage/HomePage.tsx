import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Button from '../../common/Button'

export interface HomePageProps {
  ctaLabel: string
  onCtaClick: () => void
}

function HomePage({ ctaLabel, onCtaClick }: HomePageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold text-text sm:text-4xl lg:text-5xl">{t('home.title')}</h1>
          <p className="mt-4 max-w-2xl text-base text-text-muted sm:text-lg lg:text-xl">
            {t('home.subtitle')}
          </p>
        </div>

        <Button type="button" variant="primary" size="lg" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      </main>

      <Footer />
    </div>
  )
}

export default HomePage
