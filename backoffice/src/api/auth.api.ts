import axiosInstance from './axiosInstance'
import type { LoginCredentials, LoginResponse } from '../types/auth.types'

// Llamados al backend del grupo "auth". Los hooks consumen esta función vía
// TanStack Query; los componentes nunca llaman a axios directamente.

export const login = (credentials: LoginCredentials): Promise<LoginResponse> =>
  axiosInstance
    .post<LoginResponse>('/auth/backoffice/login', credentials)
    .then((response) => response.data)
