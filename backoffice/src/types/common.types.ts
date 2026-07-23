import type { ReactNode } from 'react'

// Tipos transversales compartidos entre grupos de páginas

export interface ApiError {
  message: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// Tema de la aplicación
export type ThemeMode = 'light' | 'dark'

// Componentes comunes

export type ButtonVariant = 'primary' | 'secondary' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

// DataTable

export type DataTableAlign = 'left' | 'center' | 'right'

// Dirección de sorting server-side. Espejo del contrato `sortDirection` que
// esperan los endpoints paginados (junto con `sortField`); ver
// `.claude/skills/paginated-grid`.
export type SortDirection = 'asc' | 'desc'

// Valor "crudo" de una celda: se usa tanto para renderizar (si no hay `render`)
// como para ordenar, por eso debe ser un primitivo y no un ReactNode.
export type DataTableCellValue = string | number | boolean | null | undefined

export interface DataTableColumn<T> {
  id: string
  /** Header ya traducido: la página resuelve i18n antes de armar las columnas. */
  header: string
  accessor: (row: T) => DataTableCellValue
  /** Render custom de la celda; si falta se muestra el valor del accessor. */
  render?: (row: T) => ReactNode
  sortable?: boolean
  align?: DataTableAlign
}

export type DataTableActionVariant = 'default' | 'danger'

// Acción de la última columna (ícono clickeable por fila)
export interface DataTableAction<T> {
  id: string
  /** Label ya traducido: se usa como aria-label/title del ícono. */
  label: string
  icon: ReactNode
  onClick: (row: T) => void
  variant?: DataTableActionVariant
  disabled?: (row: T) => boolean
}

// Forma mínima que debe devolver el hook de datos que recibe el DataTable.
// Cualquier useQuery de TanStack Query la cumple estructuralmente.
export interface DataTableDataResult<T> {
  data: T[] | undefined
  isLoading: boolean
  isError: boolean
  /**
   * Total de filas del recurso completo (todas las páginas), no solo las de
   * `data`. Solo lo necesita el modo de paginado server-side (ver props
   * `page`/`onPageChange` de `DataTable`): con ese modo activo, `DataTable`
   * usa este valor para calcular `pageCount`. En modo client-side (default)
   * se ignora.
   */
  total?: number
}
