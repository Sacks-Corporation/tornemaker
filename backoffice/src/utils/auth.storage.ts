import type { AdminData } from '../types/auth.types'

// Persistencia de sesión en localStorage. Centralizado acá para que
// axiosInstance y los hooks de auth usen siempre las mismas claves.

const TOKEN_STORAGE_KEY = 'tornemaker-backoffice-token'
const ADMIN_STORAGE_KEY = 'tornemaker-backoffice-admin'

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY)

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const getStoredAdmin = (): AdminData | null => {
  const raw = localStorage.getItem(ADMIN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminData
  } catch {
    return null
  }
}

export const setStoredAdmin = (admin: AdminData): void => {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin))
}

export const clearStoredSession = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(ADMIN_STORAGE_KEY)
}
