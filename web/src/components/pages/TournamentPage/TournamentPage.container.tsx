import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import TournamentPage from './TournamentPage'
import UpcomingMatchesBar from './UpcomingMatchesBar'
import KnockoutBracket from './KnockoutBracket'
import LeagueStagePanel from './LeagueStagePanel'
import GroupStagePanel from './GroupStagePanel'
import SwissBoard from './SwissBoard'
import MatchResultModal from './MatchResultModal'
import ResetTournamentModal from './ResetTournamentModal'
import Snackbar from '../../common/Snackbar'
import type { TabItem } from '../../common/Tabs'
import { useTournamentQuery, useUpcomingMatchesQuery } from '../../../hooks/tournaments/useTournamentQueries'
import { buildTeamMap, isTwoLeggedPhase } from '../../../utils/tournament.utils'
import type { SnackbarVariant } from '../../../types/common.types'
import type { UpcomingMatch } from '../../../types/tournament.types'

interface SnackbarState {
  message: string
  variant: SnackbarVariant
}

// Orquesta la pantalla de simulación de un torneo: fetch de torneo + próximos
// partidos, mapa de equipos (lookup de presentación), tabs por fase, modal de
// carga de resultado y snackbar de feedback. El ruteo por `format` y la
// habilitación de tabs por `state` viven acá; el resto de la lógica de
// datos vive en cada subcomponente/hook.
function TournamentPageContainer() {
  const { id } = useParams<{ id: string }>()
  const tournamentId = id ?? ''
  const { t } = useTranslation()

  const tournamentQuery = useTournamentQuery(tournamentId)
  const upcomingMatchesQuery = useUpcomingMatchesQuery(tournamentId)

  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<UpcomingMatch | null>(null)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [snackbarState, setSnackbarState] = useState<SnackbarState | null>(null)

  const tournament = tournamentQuery.data
  const teamMap = useMemo(() => buildTeamMap(tournament?.teams ?? []), [tournament])

  const isLoading = tournamentQuery.isLoading || upcomingMatchesQuery.isLoading
  const isError = tournamentQuery.isError || upcomingMatchesQuery.isError

  // Tab por defecto según `state` (nunca inferido del contenido de las fases).
  const defaultTab: string | null = !tournament
    ? null
    : tournament.format === 'GROUP_STAGE_PLUS_ELIMINATION'
      ? tournament.state === 'GROUPS'
        ? 'groupStage'
        : 'knockout'
      : tournament.format === 'SWISS_PLUS_ELIMINATION'
        ? tournament.state === 'SWISS'
          ? 'swissStage'
          : 'knockout'
        : null

  const effectiveTab = activeTab ?? defaultTab

  const tabs: TabItem[] | null = !tournament
    ? null
    : tournament.format === 'GROUP_STAGE_PLUS_ELIMINATION'
      ? [
          { key: 'groupStage', label: t('tournament.tournamentPage.tabs.groupStage') },
          {
            key: 'knockout',
            label: t('tournament.tournamentPage.tabs.knockout'),
            disabled: tournament.state === 'GROUPS',
            disabledHint: t('tournament.tournamentPage.tabs.lockedHint'),
          },
        ]
      : tournament.format === 'SWISS_PLUS_ELIMINATION'
        ? [
            { key: 'swissStage', label: t('tournament.tournamentPage.tabs.swissStage') },
            {
              key: 'knockout',
              label: t('tournament.tournamentPage.tabs.knockout'),
              disabled: tournament.state === 'SWISS',
              disabledHint: t('tournament.tournamentPage.tabs.lockedHint'),
            },
          ]
        : null

  const handleTabChange = (key: string) => {
    const tab = tabs?.find((item) => item.key === key)
    if (!tab || tab.disabled) return
    setActiveTab(key)
  }

  const handleSelectMatch = (match: UpcomingMatch) => setSelectedMatch(match)
  const handleCloseModal = () => setSelectedMatch(null)

  const handleModalSuccess = () => {
    setSelectedMatch(null)
    setSnackbarState({ message: t('tournament.tournamentPage.snackbar.success'), variant: 'success' })
  }

  const handleModalError = (message: string) => {
    setSnackbarState({ message, variant: 'error' })
  }

  const handleResetClick = () => setIsResetModalOpen(true)
  const handleCloseResetModal = () => setIsResetModalOpen(false)

  const handleResetSuccess = () => {
    setIsResetModalOpen(false)
    setSnackbarState({ message: t('tournament.tournamentPage.resetModal.snackbar.success'), variant: 'success' })
  }

  const handleResetError = (message: string) => {
    setSnackbarState({ message, variant: 'error' })
  }

  let content: ReactNode = null

  if (tournament) {
    switch (tournament.format) {
      case 'SINGLE_ELIMINATION':
        content = tournament.knockoutStage && (
          <KnockoutBracket bracket={tournament.knockoutStage.bracket} teamMap={teamMap} />
        )
        break

      case 'LEAGUE':
        content = tournament.leagueStage && (
          <LeagueStagePanel
            standings={tournament.leagueStage.standings}
            tiebreakMatches={tournament.leagueStage.tiebreakMatches}
            teamMap={teamMap}
          />
        )
        break

      case 'GROUP_STAGE_PLUS_ELIMINATION':
        content =
          effectiveTab === 'knockout'
            ? tournament.knockoutStage && (
                <KnockoutBracket bracket={tournament.knockoutStage.bracket} teamMap={teamMap} />
              )
            : tournament.groupStage && (
                <GroupStagePanel groups={tournament.groupStage.groups} teamMap={teamMap} />
              )
        break

      case 'SWISS_PLUS_ELIMINATION':
        content =
          effectiveTab === 'knockout'
            ? tournament.knockoutStage && (
                <KnockoutBracket bracket={tournament.knockoutStage.bracket} teamMap={teamMap} />
              )
            : tournament.swissStage && (
                <SwissBoard swissStage={tournament.swissStage} teamMap={teamMap} />
              )
        break

      default:
        content = null
    }
  }

  const upcomingBar = tournament && (
    <UpcomingMatchesBar
      tournament={tournament}
      upcomingMatches={upcomingMatchesQuery.data ?? []}
      teamMap={teamMap}
      onSelectMatch={handleSelectMatch}
      onResetClick={handleResetClick}
    />
  )

  const modal = (
    <>
      {tournament && selectedMatch && (
        <MatchResultModal
          tournamentId={tournamentId}
          match={selectedMatch}
          legLabel={
            selectedMatch.legNumber === 2 || isTwoLeggedPhase(tournament, selectedMatch.phase)
              ? selectedMatch.legNumber === 1
                ? t('tournament.tournamentPage.upcomingBar.legFirst')
                : t('tournament.tournamentPage.upcomingBar.legSecond')
              : undefined
          }
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      )}

      {tournament && isResetModalOpen && (
        <ResetTournamentModal
          tournamentId={tournamentId}
          onClose={handleCloseResetModal}
          onSuccess={handleResetSuccess}
          onError={handleResetError}
        />
      )}
    </>
  )

  const snackbar = (
    <Snackbar
      message={snackbarState?.message ?? null}
      variant={snackbarState?.variant}
      onClose={() => setSnackbarState(null)}
    />
  )

  return (
    <TournamentPage
      isLoading={isLoading}
      isError={isError}
      tournamentName={tournament?.name ?? null}
      tabs={tabs}
      activeTab={effectiveTab}
      onTabChange={handleTabChange}
      upcomingBar={upcomingBar}
      content={content}
      modal={modal}
      snackbar={snackbar}
    />
  )
}

export default TournamentPageContainer
