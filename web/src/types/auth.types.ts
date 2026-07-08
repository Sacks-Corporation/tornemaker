// Tipos del grupo de páginas "auth" (login, registro, sesión)

export type AuthProvider = 'local' | 'google'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  provider: AuthProvider
  picture: string | null
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface GoogleLoginPayload {
  idToken: string
}

// Mensajes de error tal como los devuelve el backend (Nest) en el campo `message`
export type AuthErrorMessage =
  | 'INVALID_CREDENTIALS'
  | 'USE_GOOGLE_LOGIN'
  | 'EMAIL_ALREADY_REGISTERED'
  | string

export interface AuthErrorResponse {
  statusCode: number
  message: AuthErrorMessage
  error: string
}
