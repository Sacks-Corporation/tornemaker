import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

export interface ProtectedRouteProps {
  isAuthenticated: boolean
  children: ReactNode
}

// Envuelve rutas que requieren sesión iniciada. Sin sesión redirige a /login;
// con sesión renderiza los children (normalmente el SidebarLayout con su Outlet).
function ProtectedRoute({ isAuthenticated, children }: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
