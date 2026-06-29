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
