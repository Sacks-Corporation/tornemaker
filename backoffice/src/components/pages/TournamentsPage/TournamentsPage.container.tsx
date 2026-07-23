import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TournamentsPage, { TournamentStateBadge } from './TournamentsPage'
import DataTable from '../../common/DataTable'
import { useGetTournaments } from '../../../hooks/tournaments/useGetTournaments'
import { useAutoPageSize } from '../../../hooks/common/useAutoPageSize'
import { formatDate } from '../../../utils/date.utils'
import type {
  DataTableColumn,
  DataTableDataResult,
  SortDirection,
} from '../../../types/common.types'
import type { TournamentListItem } from '../../../types/tournaments.types'

function TournamentsPageContainer() {
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  // `sortField`/`sortDirection` son obligatorios (la API los exige): arrancan
  // con un orden por defecto (más recientes primero) que siempre se manda,
  // hasta que el usuario clickea un header.
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const pageSize = useAutoPageSize({ containerRef: tableContainerRef })

  const handleSortChange = (field: string, direction: SortDirection) => {
    setSortField(field)
    setSortDirection(direction)
    setPage(1)
  }

  // Hook "puente" entre `useGetTournaments` (TanStack Query, devuelve el
  // `PaginatedResponse` completo) y el contrato `DataTableDataResult` que
  // espera `DataTable`. Se redefine en cada render de este container para
  // cerrar sobre `page`/`pageSize` actuales; `DataTable` lo invoca de forma
  // incondicional en cada uno de sus propios renders, así que el orden de
  // hooks se mantiene estable entre renders.
  //
  // Mientras `pageSize` todavía no se midió (`undefined`), `useGetTournaments`
  // está deshabilitado (no dispara fetch) — se fuerza `isLoading: true` acá
  // para que `DataTable` siga mostrando el skeleton en vez de "no hay datos".
  const useTournamentsTableData = (): DataTableDataResult<TournamentListItem> => {
    const { data, isLoading, isError } = useGetTournaments(
      page,
      pageSize,
      sortField,
      sortDirection,
    )
    return {
      data: data?.data,
      isLoading: pageSize === undefined || isLoading,
      isError,
      total: data?.total,
    }
  }

  const columns = useMemo<DataTableColumn<TournamentListItem>[]>(
    () => [
      {
        id: 'name',
        header: t('tournaments.columns.name'),
        accessor: (row) => row.name,
        sortable: true,
      },
      {
        id: 'format',
        header: t('tournaments.columns.format'),
        accessor: (row) => row.format,
        render: (row) => t(`tournaments.formats.${row.format}`),
        sortable: true,
      },
      {
        id: 'teamCount',
        header: t('tournaments.columns.teamCount'),
        accessor: (row) => row.teamCount,
        sortable: true,
        align: 'right',
      },
      {
        id: 'consoleCount',
        header: t('tournaments.columns.consoleCount'),
        accessor: (row) => row.consoleCount,
        sortable: true,
        align: 'right',
      },
      {
        id: 'state',
        header: t('tournaments.columns.state'),
        accessor: (row) => row.state,
        render: (row) =>
          row.state ? (
            <TournamentStateBadge state={row.state} label={t(`tournaments.states.${row.state}`)} />
          ) : (
            '—'
          ),
        sortable: true,
      },
      {
        id: 'createdAt',
        header: t('tournaments.columns.createdAt'),
        accessor: (row) => row.createdAt,
        render: (row) => formatDate(row.createdAt),
        sortable: true,
      },
      {
        id: 'updatedAt',
        header: t('tournaments.columns.updatedAt'),
        accessor: (row) => row.updatedAt,
        render: (row) => formatDate(row.updatedAt),
        sortable: true,
      },
    ],
    [t],
  )

  return (
    <TournamentsPage
      title={t('tournaments.title')}
      subtitle={t('tournaments.subtitle')}
      tableContainerRef={tableContainerRef}
      table={
        <DataTable
          useData={useTournamentsTableData}
          columns={columns}
          pageSize={pageSize}
          page={page}
          onPageChange={setPage}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          getRowId={(row) => row.id}
        />
      }
    />
  )
}

export default TournamentsPageContainer
