import { AxiosError } from 'axios'
import type { AuthErrorResponse } from '../types/auth.types'

// Claves i18n (dentro de auth.errors) para cada `message` conocido del backend.
// Cualquier mensaje no mapeado cae en la clave "generic".
const KNOWN_MESSAGE_KEYS: Record<string, string> = {
  INVALID_CREDENTIALS: 'auth.errors.invalidCredentials',
  USE_GOOGLE_LOGIN: 'auth.errors.useGoogleLogin',
  EMAIL_ALREADY_REGISTERED: 'auth.errors.emailAlreadyRegistered',
  USER_NOT_REGISTERED: 'auth.errors.userNotRegistered',
}

// Traduce un error de axios proveniente de la API a una clave i18n lista para
// pasarle a `t()`. Nest devuelve `{ statusCode, message, error }`.
export function getAuthErrorKey(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as AuthErrorResponse | undefined
    const message = data?.message
    if (message && KNOWN_MESSAGE_KEYS[message]) {
      return KNOWN_MESSAGE_KEYS[message]
    }
  }
  return 'auth.errors.generic'
}

// Indica si el error de axios corresponde a un login con Google de un usuario que
// todavía no tiene cuenta creada (backend responde 401 USER_NOT_REGISTERED).
export function isUserNotRegisteredError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const data = error.response?.data as AuthErrorResponse | undefined
    return data?.message === 'USER_NOT_REGISTERED'
  }
  return false
}
