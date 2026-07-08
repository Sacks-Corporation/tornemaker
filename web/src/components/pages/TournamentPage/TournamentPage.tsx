import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'

export interface TournamentPageProps {
  tournamentId: string
}

// Placeholder de la pantalla de simulación del torneo. Todavía no consume el
// backend; solo confirma que la navegación post-creación funciona.
function TournamentPage({ tournamentId }: TournamentPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">{t('tournament.tournamentPage.title')}</h1>
        <p className="text-sm text-text-muted sm:text-base">
          {t('tournament.tournamentPage.subtitle')}
        </p>
        <p className="text-xs text-text-muted">ID: {tournamentId}</p>
      </main>

      <Footer />
    </div>
  )
}

export default TournamentPage
