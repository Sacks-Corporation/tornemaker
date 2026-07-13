import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Tabs from '../../common/Tabs'
import Skeleton from '../../common/Skeleton'
import type { TabItem } from '../../common/Tabs'

const LOADING_CONTENT_CARD_COUNT = 6

// Silueta de la pantalla completa (barra de próximos partidos + título + tabs
// + grilla de contenido) mientras se resuelve GET /tournaments/:id.
function TournamentPageSkeleton() {
  return (
    <>
      <section className="w-full border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8" aria-hidden="true">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8" aria-hidden="true">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: LOADING_CONTENT_CARD_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    </>
  )
}

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

      {isLoading && !isError && (
        <div role="status" aria-busy="true" aria-label={t('tournament.tournamentPage.loading')}>
          <TournamentPageSkeleton />
        </div>
      )}

      {!isLoading && !isError && upcomingBar}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
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
