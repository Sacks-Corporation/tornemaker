// Tipos del grupo de páginas "auth" (login y sesión del backoffice)

export interface AdminData {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  admin: AdminData
}
