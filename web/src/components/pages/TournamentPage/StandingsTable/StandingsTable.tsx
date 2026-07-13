import { useTranslation } from 'react-i18next'

export interface StandingsRowView {
  teamId: string
  rank?: number
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface StandingsTableProps {
  caption?: string
  rows: StandingsRowView[]
}

// Tabla de posiciones. Los datos ya vienen ordenados y con `rank` desde el
// back (Standing[]); acá solo se pintan las columnas.
function StandingsTable({ caption, rows }: StandingsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      {caption && <h3 className="text-base font-semibold text-text">{caption}</h3>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t('tournament.tournamentPage.standings.columns.rank')}</th>
              <th className="px-3 py-2 font-medium">{t('tournament.tournamentPage.standings.columns.team')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.played')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.won')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.drawn')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.lost')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.goalsFor')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.goalsAgainst')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.goalDifference')}</th>
              <th className="px-3 py-2 text-center font-medium">{t('tournament.tournamentPage.standings.columns.points')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.teamId} className="text-text">
                <td className="px-3 py-2 text-text-muted">{row.rank ?? '-'}</td>
                <td className="px-3 py-2 font-medium">{row.teamName}</td>
                <td className="px-3 py-2 text-center">{row.played}</td>
                <td className="px-3 py-2 text-center">{row.won}</td>
                <td className="px-3 py-2 text-center">{row.drawn}</td>
                <td className="px-3 py-2 text-center">{row.lost}</td>
                <td className="px-3 py-2 text-center">{row.goalsFor}</td>
                <td className="px-3 py-2 text-center">{row.goalsAgainst}</td>
                <td className="px-3 py-2 text-center">{row.goalDifference}</td>
                <td className="px-3 py-2 text-center font-semibold">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StandingsTable
