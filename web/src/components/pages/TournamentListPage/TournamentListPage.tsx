import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../../common/Header'
import Footer from '../../common/Footer'
import Button from '../../common/Button'
import TournamentCard from '../../common/TournamentCard'
import Skeleton from '../../common/Skeleton'
import type { TournamentStatus } from '../../../types/tournament.types'

const LOADING_CARD_COUNT = 6

// Placeholder con la misma silueta que TournamentCard (título, badge de
// estado, footer con equipos/fecha), mostrado mientras GET /tournaments
// todavía está en vuelo.
function TournamentCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full flex-col gap-3 rounded-2xl border-2 border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export interface TournamentListItem {
  id: string
  name: string
  formatLabel: string
  status: TournamentStatus
  statusLabel: string
  teamCountLabel: string
  dateLabel: string
}

export interface TournamentListPageProps {
  isLoading: boolean
  isError: boolean
  tournaments: TournamentListItem[]
  onSelectTournament: (tournamentId: string) => void
  onCreateClick: () => void
  onDeleteTournament: (tournament: TournamentListItem) => void
  modal: ReactNode
  snackbar: ReactNode
}

// Listado de torneos guardados del usuario. Solo pinta la metadata liviana
// que devuelve GET /tournaments (sin fixtures/matches/standings).
function TournamentListPage({
  isLoading,
  isError,
  tournaments,
  onSelectTournament,
  onCreateClick,
  onDeleteTournament,
  modal,
  snackbar,
}: TournamentListPageProps) {
  const { t } = useTranslation()
  const isEmpty = !isLoading && !isError && tournaments.length === 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-text sm:text-3xl">{t('tournament.list.title')}</h1>

        {isLoading && (
          <div
            role="status"
            aria-busy="true"
            aria-label={t('tournament.list.loading')}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: LOADING_CARD_COUNT }, (_, index) => (
              <TournamentCardSkeleton key={index} />
            ))}
          </div>
        )}

        {isError && (
          <p className="py-10 text-center text-sm text-red-600">{t('tournament.list.loadError')}</p>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div>
              <p className="text-lg font-semibold text-text">{t('tournament.list.empty.title')}</p>
              <p className="mt-1 text-sm text-text-muted">{t('tournament.list.empty.subtitle')}</p>
            </div>
            <Button type="button" variant="primary" onClick={onCreateClick}>
              {t('tournament.list.empty.cta')}
            </Button>
          </div>
        )}

        {!isLoading && !isError && tournaments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                name={tournament.name}
                formatLabel={tournament.formatLabel}
                status={tournament.status}
                statusLabel={tournament.statusLabel}
                teamCountLabel={tournament.teamCountLabel}
                dateLabel={tournament.dateLabel}
                onClick={() => onSelectTournament(tournament.id)}
                onDelete={() => onDeleteTournament(tournament)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
      {modal}
      {snackbar}
    </div>
  )
}

export default TournamentListPage
