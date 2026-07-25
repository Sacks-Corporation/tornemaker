// Tipos del grupo de páginas "users" (listado de usuarios del backoffice)

// Espejo de `UserState` (api/src/users/schemas/user-state.enum.ts). `state`
// es el estado EFECTIVO calculado por el backend en cada request, no
// necesariamente el persistido.
export type UserState = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

export type UserProvider = 'local' | 'google'

// Fila devuelta por `GET /users` (ver `api/src/users/user-list-item.ts`).
// `updatedAt`/`lastSignedIn` viajan serializadas como ISO string (JSON).
export interface UserListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  updatedAt: string
  lastSignedIn: string
  state: UserState
  provider: UserProvider
  /** Flag persistido (distinto de `state`, que es el estado EFECTIVO
   * calculado por el backend): habilita/deshabilita el acceso del usuario.
   * Lo togglean `PATCH /users/:id/enable` y `PATCH /users/:id/disable`. */
  enabled: boolean
}

// Acción disponible para togglear `enabled` desde la grilla: "enable" cuando
// el usuario está deshabilitado, "disable" cuando está habilitado.
export type UserEnablementAction = 'enable' | 'disable'
