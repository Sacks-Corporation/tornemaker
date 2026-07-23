import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTournaments } from '../../api/tournaments.api'

export const TOURNAMENTS_QUERY_KEY = 'tournaments' as const

// Query (TanStack Query) del grupo "tournaments": trae una página del
// listado de torneos. `page`/`pageSize` viajan en el `queryKey` para que
// cada combinación tenga su propia entrada de cache. `placeholderData:
// keepPreviousData` mantiene la página anterior visible mientras se resuelve
// la siguiente, para que cambiar de página no "parpadee" a vacío/skeleton.
//
// `pageSize` puede llegar `undefined` mientras `useAutoPageSize` todavía no
// midió el viewport (ver `hooks/common/useAutoPageSize.ts`): `enabled` frena
// el fetch hasta tener el valor real, para no disparar una primera request
// con un `pageSize` por defecto que se descarta enseguida.
export function useGetTournaments(page: number, pageSize: number | undefined) {
  return useQuery({
    queryKey: [TOURNAMENTS_QUERY_KEY, page, pageSize],
    queryFn: () => getTournaments(page, pageSize as number),
    enabled: pageSize !== undefined,
    placeholderData: keepPreviousData,
  })
}
