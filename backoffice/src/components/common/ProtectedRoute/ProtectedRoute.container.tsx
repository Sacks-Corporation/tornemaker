import type { ReactNode } from 'react'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../../../hooks/auth/useAuth'

export interface ProtectedRouteContainerProps {
  children: ReactNode
}

function ProtectedRouteContainer({ children }: ProtectedRouteContainerProps) {
  const { isAuthenticated } = useAuth()

  return <ProtectedRoute isAuthenticated={isAuthenticated}>{children}</ProtectedRoute>
}

export default ProtectedRouteContainer
export type { ProtectedRouteProps } from './ProtectedRoute'
