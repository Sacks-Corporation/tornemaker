import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth.api'
import type { LoginCredentials, LoginResponse } from '../../types/auth.types'
import { setStoredAdmin, setStoredToken } from '../../utils/auth.storage'

// Mutación de login (TanStack Query) del grupo "auth". El container de
// LoginPage la consume; nunca llama a axios ni a src/api directamente.
// Al resolver con éxito persiste la sesión y navega al dashboard.
export function useLogin() {
  const navigate = useNavigate()

  return useMutation<LoginResponse, unknown, LoginCredentials>({
    mutationFn: login,
    onSuccess: (data) => {
      setStoredToken(data.accessToken)
      setStoredAdmin(data.admin)
      navigate('/', { replace: true })
    },
  })
}
