import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, loginWithGoogle, register, registerWithGoogle } from '../../api/auth.api'
import type {
  AuthResponse,
  GoogleLoginPayload,
  LoginPayload,
  RegisterPayload,
} from '../../types/auth.types'
import { AUTH_ME_QUERY_KEY } from './useMe'

// Mutaciones de escritura del grupo "auth" (TanStack Query). Los containers de
// LoginPage / RegisterPage consumen estos hooks; nunca llaman a axios ni a
// src/api directamente.

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation<AuthResponse, unknown, LoginPayload>({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, data.user)
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation<AuthResponse, unknown, RegisterPayload>({
    mutationFn: register,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, data.user)
    },
  })
}

export function useGoogleLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation<AuthResponse, unknown, GoogleLoginPayload>({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, data.user)
    },
  })
}

export function useGoogleRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation<AuthResponse, unknown, GoogleLoginPayload>({
    mutationFn: registerWithGoogle,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, data.user)
    },
  })
}
