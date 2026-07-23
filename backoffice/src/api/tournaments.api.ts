import axiosInstance from './axiosInstance'
import type { PaginatedResponse, SortDirection } from '../types/common.types'
import type { TournamentListItem } from '../types/tournaments.types'

// Llamados al backend del grupo "tournaments". Los hooks consumen esta
// función vía TanStack Query; los componentes nunca llaman a axios directamente.

// GET /tournaments/backoffice — listado paginado (server-side) de torneos,
// `page` 1-indexed, igual que el contrato del backend (ver
// `.claude/skills/paginated-endpoint`).
// `sortField`/`sortDirection` son OBLIGATORIOS: siempre se manda un orden (el
// container arranca con un default), la API los exige (ver
// `.claude/skills/paginated-grid`).
export const getTournaments = (
  page: number,
  pageSize: number,
  sortField: string,
  sortDirection: SortDirection,
): Promise<PaginatedResponse<TournamentListItem>> =>
  axiosInstance
    .get<PaginatedResponse<TournamentListItem>>('/tournaments/backoffice', {
      params: { page, pageSize, sortField, sortDirection },
    })
    .then((response) => response.data)
