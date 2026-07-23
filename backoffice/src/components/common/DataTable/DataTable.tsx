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
  SortDirection,
} from '../../../types/common.types'

export interface DataTableLabels {
  actions: string
  empty: string
  error: string
  loading: string
  previousPage: string
  nextPage: string
  pageOf: (page: number, total: number) => string
  /** Total de filas disponibles (ej. "16 resultados"). Se usa en modo
   * server-side, donde el footer siempre muestra el total, haya una o
   * varias páginas. */
  total: (total: number) => string
}

export interface DataTableViewProps<T> {
  rows: T[]
  columns: DataTableColumn<T>[]
  actionColumns?: DataTableAction<T>[]
  isLoading: boolean
  isError: boolean
  labels: DataTableLabels
  /** Filas por página (default 10). En modo server-side es la cantidad de
   * filas que trae cada página (ver `page`/`total`/`onPageChange`). */
  pageSize?: number
  getRowId?: (row: T, index: number) => string
  /**
   * Modo de paginado "manual"/server-side: `rows` ya es la página actual
   * (la trajo así el backend), no la lista completa. Al pasar `page` +
   * `total` + `onPageChange`, la tabla deja de paginar en memoria
   * (`manualPagination: true` + `pageCount` derivado de `total`/`pageSize`)
   * y delega la navegación al padre. Si falta alguna de las tres, se usa el
   * modo client-side de siempre (paginación en memoria sobre `rows`).
   *
   * `page` es 1-indexed (coincide con el contrato `PaginatedResponse` del
   * backend), a diferencia del `pageIndex` (0-indexed) interno de
   * `@tanstack/react-table`.
   *
   * El sorting en este modo es responsabilidad del padre: ver
   * `sortField`/`sortDirection`/`onSortChange`.
   */
  page?: number
  total?: number
  onPageChange?: (page: number) => void
  /**
   * Sorting controlado server-side (solo tiene sentido junto al modo
   * server-side de paginación de arriba). Al pasar `onSortChange`, el
   * sorting deja de resolverse en memoria: se activa `manualSorting: true`
   * (react-table asume que `rows` ya viene ordenado por el backend y no lo
   * reordena) y el click en un header `sortable` dispara `onSortChange` en
   * vez de tocar estado interno.
   *
   * `sortField` es el `id` de la columna activa (o `undefined` si todavía no
   * se aplicó ningún sort — la API usa su orden por defecto) y
   * `sortDirection` su dirección. Toggle: click en una columna distinta a la
   * activa → `onSortChange(col.id, 'asc')`; click en la columna ya activa →
   * alterna `asc` ↔ `desc` (nunca vuelve a "sin sort").
   *
   * Sin `onSortChange`, se mantiene el sorting en memoria de siempre (modo
   * client-side, o server-side solo de paginación).
   */
  sortField?: string
  sortDirection?: SortDirection
  onSortChange?: (field: string, direction: SortDirection) => void
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
  page,
  total,
  onPageChange,
  sortField,
  sortDirection,
  onSortChange,
}: DataTableViewProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  // El modo server-side lo define el padre al pasar `page` + `onPageChange`
  // (props de control), NO `total`: `total` es un dato async que llega undefined
  // durante la carga inicial, así que no puede decidir el modo sin crashear.
  const isServerPaginated = page !== undefined && onPageChange !== undefined
  // El sorting server-side lo define el padre al pasar `onSortChange`. `rows`
  // ya viene ordenado por el backend, así que no hay que reordenarlo acá.
  const isServerSorted = onSortChange !== undefined

  // Estado de sorting controlado: reconstruido a partir de `sortField`/
  // `sortDirection` (nunca del estado interno `sorting`) para que el
  // indicador de la columna activa refleje siempre lo que decide el padre.
  const controlledSorting = useMemo<SortingState>(
    () => (sortField ? [{ id: sortField, desc: sortDirection === 'desc' }] : []),
    [sortField, sortDirection],
  )

  const handleServerSort = (columnId: string) => {
    if (!onSortChange) return
    if (sortField === columnId) {
      onSortChange(columnId, sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(columnId, 'asc')
    }
  }

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
    state: {
      // En modo sort server-side, `sorting` es 100% controlado por
      // `sortField`/`sortDirection` (nunca por el estado interno `sorting`,
      // que solo se usa en modo client-side).
      sorting: isServerSorted ? controlledSorting : sorting,
      // En modo server-side la paginación es controlada: la fuente de verdad es
      // la prop `page` (del padre), no el estado interno de la tabla. En modo
      // client-side NO incluimos `pagination` en `state` (pasar `undefined`
      // rompe el estado que viene de `initialState`).
      ...(isServerPaginated
        ? { pagination: { pageIndex: page - 1, pageSize } }
        : {}),
    },
    // En modo sort server-side el click en el header no pasa por acá (ver
    // `handleServerSort`, usado directo en el `onClick` del header más abajo):
    // este handler queda de no-op para no pisar el estado controlado.
    onSortingChange: isServerSorted ? () => {} : setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // `manualSorting: true` le indica a react-table que `rows` YA viene
    // ordenado por el backend: `getSortedRowModel` deja de reordenar en
    // memoria y devuelve las filas tal cual llegaron (ver
    // `RowSorting.js`/`_getSortedRowModel` de `@tanstack/table-core`).
    manualSorting: isServerSorted,
    manualPagination: isServerPaginated,
    pageCount: isServerPaginated
      ? Math.max(1, Math.ceil((total ?? 0) / pageSize))
      : undefined,
    initialState: isServerPaginated ? undefined : { pagination: { pageSize } },
    getRowId,
  })

  const visibleColumnCount = table.getVisibleLeafColumns().length
  const pageIndex = isServerPaginated ? page - 1 : table.getState().pagination.pageIndex
  const pageCount = isServerPaginated
    ? Math.max(1, Math.ceil((total ?? 0) / pageSize))
    : table.getPageCount()
  const isEmpty = !isLoading && !isError && rows.length === 0

  const goToPreviousPage = () => {
    if (isServerPaginated) {
      onPageChange(page - 1)
      return
    }
    table.previousPage()
  }

  const goToNextPage = () => {
    if (isServerPaginated) {
      onPageChange(page + 1)
      return
    }
    table.nextPage()
  }

  const canGoToPreviousPage = isServerPaginated ? page > 1 : table.getCanPreviousPage()
  const canGoToNextPage = isServerPaginated ? page < pageCount : table.getCanNextPage()

  // En modo server-side el footer (con el total) se muestra SIEMPRE que ya se
  // conozca `total` (aunque entre todo en una sola página) — es la única
  // forma de comunicar cuántos resultados hay en total, dado que `rows` es
  // solo la página actual. En modo client-side se mantiene el comportamiento
  // de siempre (solo con más de una página).
  const showFooter = isServerPaginated ? total !== undefined : pageCount > 1

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
                  // Refleja `header.column.getIsSorted()`, que en modo server
                  // sort ya está resuelto por `controlledSorting` (viene de
                  // `sortField`/`sortDirection`, no de estado interno).
                  const columnSortDirection = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        columnSortDirection === 'asc'
                          ? 'ascending'
                          : columnSortDirection === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className={[
                        'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted',
                        alignClasses[align],
                      ].join(' ')}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={
                            isServerSorted
                              ? () => handleServerSort(header.column.id)
                              : header.column.getToggleSortingHandler()
                          }
                          className="inline-flex items-center gap-1 uppercase tracking-wide transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={columnSortDirection} />
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
                        className={['whitespace-nowrap px-4 py-3 text-text', alignClasses[align]].join(' ')}
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

      {showFooter && (
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2">
          <span className="text-xs text-text-muted">
            {isServerPaginated
              ? `${labels.pageOf(pageIndex + 1, pageCount)} · ${labels.total(total ?? 0)}`
              : labels.pageOf(pageIndex + 1, pageCount)}
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <PageButton
                onClick={goToPreviousPage}
                disabled={!canGoToPreviousPage}
                label={labels.previousPage}
                direction="prev"
              />
              <PageButton
                onClick={goToNextPage}
                disabled={!canGoToNextPage}
                label={labels.nextPage}
                direction="next"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DataTable
