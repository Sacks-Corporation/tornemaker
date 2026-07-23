import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DataTable from './DataTable'
import type { DataTableLabels } from './DataTable'
import type {
  DataTableAction,
  DataTableColumn,
  DataTableDataResult,
} from '../../../types/common.types'

export interface DataTableProps<T> {
  /**
   * Hook (basado en TanStack Query) que trae las filas. La página lo pasa como
   * prop y este container lo invoca, así la tabla es dueña de sus estados de
   * carga/error. Cualquier `useQuery` lo cumple estructuralmente. En modo
   * server-side (ver `page`/`onPageChange`) también debe devolver `total`.
   */
  useData: () => DataTableDataResult<T>
  columns: DataTableColumn<T>[]
  /** Íconos de acción de la última columna. */
  actionColumns?: DataTableAction<T>[]
  /** Filas por página (default 10). En modo server-side, cantidad de filas
   * que trae cada página del backend. */
  pageSize?: number
  getRowId?: (row: T, index: number) => string
  /**
   * Modo de paginado server-side ("manual"): pasá `page` (1-indexed, estado
   * dueño de la página) + `onPageChange` junto con un `useData` que además
   * devuelva `total`. Sin estos, la tabla pagina en memoria como siempre.
   */
  page?: number
  onPageChange?: (page: number) => void
}

function DataTableContainer<T>({
  useData,
  columns,
  actionColumns,
  pageSize,
  getRowId,
  page,
  onPageChange,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const { data, isLoading, isError, total } = useData()

  const labels = useMemo<DataTableLabels>(
    () => ({
      actions: t('common.table.actions'),
      empty: t('common.table.empty'),
      error: t('common.table.error'),
      loading: t('common.table.loading'),
      previousPage: t('common.table.previousPage'),
      nextPage: t('common.table.nextPage'),
      pageOf: (page: number, total: number) => t('common.table.pageOf', { page, total }),
      total: (total: number) => t('common.table.total', { count: total }),
    }),
    [t],
  )

  return (
    <DataTable
      rows={data ?? []}
      columns={columns}
      actionColumns={actionColumns}
      isLoading={isLoading}
      isError={isError}
      labels={labels}
      pageSize={pageSize}
      getRowId={getRowId}
      page={page}
      total={total}
      onPageChange={onPageChange}
    />
  )
}

export default DataTableContainer
export type { DataTableLabels }
