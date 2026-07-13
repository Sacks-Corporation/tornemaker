import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Tabs from '../../common/Tabs'
import type { TabItem } from '../../common/Tabs'

export interface TournamentPageProps {
  isLoading: boolean
  isError: boolean
  tournamentName: string | null
  tabs: TabItem[] | null
  activeTab: string | null
  onTabChange: (key: string) => void
  upcomingBar: ReactNode
  content: ReactNode
  modal: ReactNode
  snackbar: ReactNode
}

// Pantalla de simulación de un torneo: barra superior con próximos partidos
// jugables (siempre visible), tabs por fase cuando el formato lo requiere, y
// el contenido de la fase activa (tabla, bracket o tablero suizo). Solo pinta
// lo que devuelve la API; no calcula lógica de torneo.
function TournamentPage({
  isLoading,
  isError,
  tournamentName,
  tabs,
  activeTab,
  onTabChange,
  upcomingBar,
  content,
  modal,
  snackbar,
}: TournamentPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {!isLoading && !isError && upcomingBar}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {isLoading && (
          <p className="py-10 text-center text-sm text-text-muted">
            {t('tournament.tournamentPage.loading')}
          </p>
        )}

        {isError && (
          <p className="py-10 text-center text-sm text-red-600">
            {t('tournament.tournamentPage.loadError')}
          </p>
        )}

        {!isLoading && !isError && (
          <>
            {tournamentName && (
              <h1 className="text-2xl font-bold text-text sm:text-3xl">{tournamentName}</h1>
            )}

            {tabs && activeTab && <Tabs tabs={tabs} activeKey={activeTab} onChange={onTabChange} />}

            {content}
          </>
        )}
      </main>

      <Footer />
      {modal}
      {snackbar}
    </div>
  )
}

export default TournamentPage
