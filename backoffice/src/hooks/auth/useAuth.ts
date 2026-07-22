import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AdminData } from '../../types/auth.types'
import { clearStoredSession, getStoredAdmin, getStoredToken } from '../../utils/auth.storage'

export interface UseAuthResult {
  token: string | null
  admin: AdminData | null
  isAuthenticated: boolean
  logout: () => void
}

// Hook para leer el estado de sesión persistido (token + admin) y cerrar
// sesión. No hay un contexto de React de por medio: login y logout siempre
// navegan a otra ruta (`/` o `/login`), lo que remonta el árbol que consume
// este hook, así que leer localStorage al montar alcanza para mantener todo
// sincronizado.
export function useAuth(): UseAuthResult {
  const navigate = useNavigate()
  const [token] = useState<string | null>(() => getStoredToken())
  const [admin] = useState<AdminData | null>(() => getStoredAdmin())

  const logout = useCallback(() => {
    clearStoredSession()
    navigate('/login', { replace: true })
  }, [navigate])

  return { token, admin, isAuthenticated: token !== null, logout }
}
