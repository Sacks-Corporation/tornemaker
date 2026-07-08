import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/auth/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

// Envuelve rutas que requieren sesión iniciada. Si no hay usuario autenticado
// redirige a /login guardando la ruta de origen en `state.from` para volver
// ahí después de iniciar sesión.
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
