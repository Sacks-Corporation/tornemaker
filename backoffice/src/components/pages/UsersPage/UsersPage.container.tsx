import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import UsersPage, { UserStateBadge } from './UsersPage'
import DataTable from '../../common/DataTable'
import { useGetUsers } from '../../../hooks/users/useGetUsers'
import { useAutoPageSize } from '../../../hooks/common/useAutoPageSize'
import { formatDateTime } from '../../../utils/date.utils'
import type {
  DataTableColumn,
  DataTableDataResult,
  SortDirection,
} from '../../../types/common.types'
import type { UserListItem } from '../../../types/users.types'

function UsersPageContainer() {
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

  // Hook "puente" entre `useGetUsers` (TanStack Query, devuelve el
  // `PaginatedResponse` completo) y el contrato `DataTableDataResult` que
  // espera `DataTable`. Se redefine en cada render de este container para
  // cerrar sobre `page`/`pageSize` actuales; `DataTable` lo invoca de forma
  // incondicional en cada uno de sus propios renders, así que el orden de
  // hooks se mantiene estable entre renders.
  //
  // Mientras `pageSize` todavía no se midió (`undefined`), `useGetUsers` está
  // deshabilitado (no dispara fetch) — se fuerza `isLoading: true` acá para
  // que `DataTable` siga mostrando el skeleton en vez de "no hay datos".
  const useUsersTableData = (): DataTableDataResult<UserListItem> => {
    const { data, isLoading, isError } = useGetUsers(page, pageSize, sortField, sortDirection)
    return {
      data: data?.data,
      isLoading: pageSize === undefined || isLoading,
      isError,
      total: data?.total,
    }
  }

  const columns = useMemo<DataTableColumn<UserListItem>[]>(
    () => [
      {
        id: 'name',
        header: t('users.columns.name'),
        accessor: (row) => `${row.firstName} ${row.lastName}`,
        sortable: true,
      },
      {
        id: 'email',
        header: t('users.columns.email'),
        accessor: (row) => row.email,
        sortable: true,
      },
      {
        id: 'updatedAt',
        header: t('users.columns.updatedAt'),
        accessor: (row) => row.updatedAt,
        render: (row) => formatDateTime(row.updatedAt),
        sortable: true,
      },
      {
        id: 'lastSignedIn',
        header: t('users.columns.lastSignedIn'),
        accessor: (row) => row.lastSignedIn,
        render: (row) => formatDateTime(row.lastSignedIn),
        sortable: true,
      },
      {
        id: 'state',
        header: t('users.columns.state'),
        accessor: (row) => row.state,
        render: (row) => <UserStateBadge state={row.state} label={t(`users.states.${row.state}`)} />,
        // `state` es un estado EFECTIVO calculado por el backend en cada
        // request (no un campo persistido): la API no lo soporta como
        // `sortField`, así que no se ofrece como columna ordenable.
        sortable: false,
      },
      {
        id: 'provider',
        header: t('users.columns.provider'),
        accessor: (row) => row.provider,
        render: (row) => t(`users.providers.${row.provider}`),
        sortable: true,
      },
    ],
    [t],
  )

  return (
    <UsersPage
      title={t('users.title')}
      subtitle={t('users.subtitle')}
      tableContainerRef={tableContainerRef}
      table={
        <DataTable
          useData={useUsersTableData}
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

export default UsersPageContainer
