import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import Skeleton from '../Skeleton'
import type {
  DataTableAction,
  DataTableAlign,
  DataTableColumn,
} from '../../../types/common.types'

export interface DataTableLabels {
  actions: string
  empty: string
  error: string
  loading: string
  previousPage: string
  nextPage: string
  pageOf: (page: number, total: number) => string
}

export interface DataTableViewProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  actionColumns?: DataTableAction<T>[]
  isLoading: boolean
  isError: boolean
  labels: DataTableLabels
  /** Filas por página (default 10). */
  pageSize?: number
  getRowId?: (row: T, index: number) => string
}

const alignClasses: Record<DataTableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

// Id reservado para la columna de acciones que se agrega al final.
const ACTIONS_COLUMN_ID = '__actions'

const SKELETON_ROWS = 5

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={[
        'h-3.5 w-3.5 shrink-0 transition-transform duration-150',
        direction === 'desc' ? 'rotate-180' : '',
        direction ? 'opacity-100' : 'opacity-40',
      ].join(' ')}
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M10 5l5 6H5l5-6Z" clipRule="evenodd" />
    </svg>
  )
}

interface PageButtonProps {
  onClick: () => void
  disabled: boolean
  label: string
  direction: 'prev' | 'next'
}

function PageButton({ onClick, disabled, label, direction }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors duration-150 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={['h-4 w-4', direction === 'next' ? 'rotate-180' : ''].join(' ')}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

// Tabla estándar del backoffice, construida sobre @tanstack/react-table
// (headless): la librería resuelve sorting/paginación y acá se renderiza todo
// con los tokens del tema. Maneja además los estados de carga (skeletons),
// error y vacío. Las páginas NO usan useReactTable directo: pasan por acá.
function DataTable<T>({
  rows,
  columns,
  actionColumns,
  isLoading,
  isError,
  labels,
  pageSize = 10,
  getRowId,
}: DataTableViewProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const alignByColumnId = useMemo(() => {
    const map = new Map<string, DataTableAlign>()
    for (const col of columns) map.set(col.id, col.align ?? 'left')
    map.set(ACTIONS_COLUMN_ID, 'right')
    return map
  }, [columns])

  const columnDefs = useMemo<ColumnDef<T>[]>(() => {
    const defs: ColumnDef<T>[] = columns.map((col) => ({
      id: col.id,
      header: col.header,
      // `accessorFn` devuelve el valor primitivo: es lo que usa el sorting.
      accessorFn: (row: T) => col.accessor(row),
      enableSorting: col.sortable ?? false,
      cell: ({ row }) => {
        if (col.render) return col.render(row.original)
        const value = col.accessor(row.original)
        return value === null || value === undefined || value === '' ? '—' : String(value)
      },
    }))

    if (actionColumns && actionColumns.length > 0) {
      defs.push({
        id: ACTIONS_COLUMN_ID,
        header: labels.actions,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {actionColumns.map((action) => {
              const isDisabled = action.disabled?.(row.original) ?? false
              return (
                <button
                  key={action.id}
                  type="button"
                  aria-label={action.label}
                  title={action.label}
                  disabled={isDisabled}
                  onClick={() => action.onClick(row.original)}
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    action.variant === 'danger'
                      ? 'text-text-muted hover:bg-red-500/10 hover:text-red-600'
                      : 'text-text-muted hover:bg-primary/10 hover:text-primary',
                  ].join(' ')}
                >
                  {action.icon}
                </button>
              )
            })}
          </div>
        ),
      })
    }

    return defs
  }, [columns, actionColumns, labels.actions])

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    getRowId,
  })

  const visibleColumnCount = table.getVisibleLeafColumns().length
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()
  const isEmpty = !isLoading && !isError && rows.length === 0

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-surface"
      role={isLoading ? 'status' : undefined}
      aria-label={isLoading ? labels.loading : undefined}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const align = alignByColumnId.get(header.column.id) ?? 'left'
                  const sortDirection = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sortDirection === 'asc'
                          ? 'ascending'
                          : sortDirection === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className={[
                        'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted',
                        alignClasses[align],
                      ].join(' ')}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase tracking-wide transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={sortDirection} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-b-0">
                  {Array.from({ length: visibleColumnCount }, (_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))}

            {isError && (
              <tr>
                <td
                  colSpan={visibleColumnCount}
                  className="px-4 py-8 text-center text-sm text-red-600"
                >
                  {labels.error}
                </td>
              </tr>
            )}

            {isEmpty && (
              <tr>
                <td
                  colSpan={visibleColumnCount}
                  className="px-4 py-8 text-center text-sm text-text-muted"
                >
                  {labels.empty}
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-primary/5"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = alignByColumnId.get(cell.column.id) ?? 'left'
                    return (
                      <td
                        key={cell.id}
                        className={['px-4 py-3 text-text', alignClasses[align]].join(' ')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2">
          <span className="text-xs text-text-muted">
            {labels.pageOf(pageIndex + 1, pageCount)}
          </span>
          <div className="flex items-center gap-1">
            <PageButton
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              label={labels.previousPage}
              direction="prev"
            />
            <PageButton
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              label={labels.nextPage}
              direction="next"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
