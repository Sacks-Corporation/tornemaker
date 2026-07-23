const users = {
  title: 'Usuarios',
  subtitle: 'Listado de usuarios registrados en Tornemaker.',
  columns: {
    name: 'Nombre y apellido',
    email: 'Correo',
    updatedAt: 'Última actualización',
    lastSignedIn: 'Último inicio de sesión',
    state: 'Estado',
    provider: 'Tipo',
  },
  states: {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    BLOCKED: 'Bloqueado',
  },
  providers: {
    local: 'Regular',
    google: 'Google',
  },
} as const

export default users
