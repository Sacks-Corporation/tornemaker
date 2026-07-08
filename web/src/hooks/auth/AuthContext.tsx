import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SESSION_EXPIRED_EVENT } from '../../api/axiosInstance'
import type { AuthResponse, User } from '../../types/auth.types'
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredUser,
  setStoredAccessToken,
  setStoredUser,
} from '../../utils/auth.storage'
import { AUTH_ME_QUERY_KEY, useMe } from './useMe'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Provider central del estado de sesión. Guarda el accessToken y el user en
// localStorage, revalida contra /auth/me (vía useMe + TanStack Query) cuando
// hay un token guardado, y escucha el evento de sesión expirada disparado por
// el interceptor de axios ante un 401.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const hasToken = getStoredAccessToken() !== null

  const meQuery = useMe()

  const login = useCallback((auth: AuthResponse) => {
    setStoredAccessToken(auth.accessToken)
    setStoredUser(auth.user)
    setUser(auth.user)
  }, [])

  const logout = useCallback(() => {
    clearStoredSession()
    setUser(null)
    queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
  }, [queryClient])

  useEffect(() => {
    if (meQuery.data) {
      setStoredUser(meQuery.data)
      setUser(meQuery.data)
    }
  }, [meQuery.data])

  useEffect(() => {
    if (meQuery.isError) {
      clearStoredSession()
      setUser(null)
    }
  }, [meQuery.isError])

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null)
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [queryClient])

  // Solo mostramos un estado de "inicializando" cuando hay token pero todavía
  // no sabemos si es válido (primera carga de /auth/me sin user cacheado).
  const isInitializing = hasToken && user === null && meQuery.isLoading

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      logout,
    }),
    [user, isInitializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un <AuthProvider>')
  return context
}
