import axiosInstance from './axiosInstance'
import type { PaginatedResponse } from '../types/common.types'
import type { TournamentListItem } from '../types/tournaments.types'

// Llamados al backend del grupo "tournaments". Los hooks consumen esta
// función vía TanStack Query; los componentes nunca llaman a axios directamente.

// GET /tournaments/backoffice — listado paginado (server-side) de torneos,
// `page` 1-indexed, igual que el contrato del backend (ver
// `.claude/skills/paginated-endpoint`).
export const getTournaments = (
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<TournamentListItem>> =>
  axiosInstance
    .get<PaginatedResponse<TournamentListItem>>('/tournaments/backoffice', {
      params: { page, pageSize },
    })
    .then((response) => response.data)
