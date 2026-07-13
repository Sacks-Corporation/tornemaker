import { useQuery } from '@tanstack/react-query'
import { getConsoles, getMatchModes, getTournamentFormatRules } from '../../api/utils.api'
import type {
  ConsoleCatalogItem,
  MatchModeCatalogItem,
  TournamentFormatRules,
} from '../../types/utils.types'
import type { TournamentFormat } from '../../types/tournament.types'

// Lecturas del grupo "utils" (TanStack Query). Catálogos dinámicos (viven en
// la base de datos del backend) consumidos por el wizard de creación de
// torneo y por las pantallas de visualización/carga de resultados. Cambian
// muy poco, por eso `staleTime` largo.

const CATALOG_STALE_TIME = 60 * 60 * 1000 // 1 hora

export const utilsQueryKeys = {
  consoles: () => ['utils', 'consoles'] as const,
  matchModes: () => ['utils', 'match-modes'] as const,
  formatRules: (format: TournamentFormat | null) =>
    ['utils', 'tournament-formats', format] as const,
}

export function useConsolesQuery() {
  return useQuery<ConsoleCatalogItem[]>({
    queryKey: utilsQueryKeys.consoles(),
    queryFn: getConsoles,
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useMatchModesQuery() {
  return useQuery<MatchModeCatalogItem[]>({
    queryKey: utilsQueryKeys.matchModes(),
    queryFn: getMatchModes,
    staleTime: CATALOG_STALE_TIME,
  })
}

// Solo se habilita cuando ya hay un formato elegido. La respuesta cruda trae
// un único elemento (contrato del back con el query param `format`); acá se
// devuelve ya desenvuelto para que el consumidor no tenga que indexar `[0]`.
export function useFormatRulesQuery(format: TournamentFormat | null) {
  return useQuery<TournamentFormatRules[], unknown, TournamentFormatRules | undefined>({
    queryKey: utilsQueryKeys.formatRules(format),
    queryFn: () => getTournamentFormatRules(format as TournamentFormat),
    enabled: format !== null,
    staleTime: CATALOG_STALE_TIME,
    select: (rules) => rules[0],
  })
}
