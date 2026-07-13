import { apiGet, apiPost } from './api'
import type {
  AuthResponse,
  GoogleLoginPayload,
  LoginPayload,
  RegisterPayload,
  User,
} from '../types/auth.types'

// Llamados al backend del grupo "auth". Los hooks consumen estas funciones vía TanStack Query.

export const register = (payload: RegisterPayload): Promise<AuthResponse> =>
  apiPost<AuthResponse, RegisterPayload>('/auth/register', payload)

export const login = (payload: LoginPayload): Promise<AuthResponse> =>
  apiPost<AuthResponse, LoginPayload>('/auth/login', payload)

export const loginWithGoogle = (payload: GoogleLoginPayload): Promise<AuthResponse> =>
  apiPost<AuthResponse, GoogleLoginPayload>('/auth/google', payload)

export const registerWithGoogle = (payload: GoogleLoginPayload): Promise<AuthResponse> =>
  apiPost<AuthResponse, GoogleLoginPayload>('/auth/google/register', payload)

export const getMe = (): Promise<User> => apiGet<User>('/auth/me')
