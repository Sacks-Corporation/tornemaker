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

export type SnackbarVariant = 'success' | 'error'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

export interface RadioOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}
