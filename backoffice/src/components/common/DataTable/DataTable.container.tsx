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
   * carga/error. Cualquier `useQuery` lo cumple estructuralmente.
   */
  useData: () => DataTableDataResult<T>
  columns: DataTableColumn<T>[]
  /** Íconos de acción de la última columna. */
  actionColumns?: DataTableAction<T>[]
  /** Filas por página (default 10). */
  pageSize?: number
  getRowId?: (row: T, index: number) => string
}

function DataTableContainer<T>({
  useData,
  columns,
  actionColumns,
  pageSize,
  getRowId,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useData()

  const labels = useMemo<DataTableLabels>(
    () => ({
      actions: t('common.table.actions'),
      empty: t('common.table.empty'),
      error: t('common.table.error'),
      loading: t('common.table.loading'),
      previousPage: t('common.table.previousPage'),
      nextPage: t('common.table.nextPage'),
      pageOf: (page: number, total: number) => t('common.table.pageOf', { page, total }),
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
    />
  )
}

export default DataTableContainer
export type { DataTableLabels }
