import axiosInstance from './axiosInstance'
import type { PaginatedResponse, SortDirection } from '../types/common.types'
import type { UserListItem } from '../types/users.types'

// Llamados al backend del grupo "users". Los hooks consumen esta función vía
// TanStack Query; los componentes nunca llaman a axios directamente.

// GET /users — listado paginado (server-side) de usuarios, `page` 1-indexed,
// igual que el contrato del backend (ver `.claude/skills/paginated-endpoint`).
// `sortField`/`sortDirection` son OBLIGATORIOS: siempre se manda un orden (el
// container arranca con un default), la API los exige (ver
// `.claude/skills/paginated-grid`).
export const getUsers = (
  page: number,
  pageSize: number,
  sortField: string,
  sortDirection: SortDirection,
): Promise<PaginatedResponse<UserListItem>> =>
  axiosInstance
    .get<PaginatedResponse<UserListItem>>('/users', {
      params: { page, pageSize, sortField, sortDirection },
    })
    .then((response) => response.data)
