import type { User } from '../types/auth.types'

// Persistencia de sesión en localStorage. Centralizado acá para que
// axiosInstance, el AuthContext y los hooks usen siempre las mismas claves.

const ACCESS_TOKEN_KEY = 'tornemaker-access-token'
const USER_KEY = 'tornemaker-user'

export const getStoredAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)

export const setStoredAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const setStoredUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearStoredSession = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
