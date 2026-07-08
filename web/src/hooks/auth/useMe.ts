import { useQuery } from '@tanstack/react-query'
import { getMe } from '../../api/auth.api'
import { getStoredAccessToken } from '../../utils/auth.storage'

export const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const

// Lectura del usuario autenticado. Solo se habilita si hay un accessToken
// guardado; de lo contrario no tiene sentido pegarle a /auth/me.
export function useMe() {
  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getMe,
    enabled: getStoredAccessToken() !== null,
    retry: false,
  })
}
