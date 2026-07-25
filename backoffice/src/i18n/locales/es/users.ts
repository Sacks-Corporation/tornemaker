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
  actions: {
    enable: 'Habilitar',
    disable: 'Deshabilitar',
  },
  enableOrDisableModal: {
    cancel: 'Cancelar',
    enable: {
      title: 'Habilitar usuario',
      message: '¿Confirmás que querés habilitar a {{name}}? Va a recuperar el acceso a la plataforma.',
      confirm: 'Habilitar',
      confirming: 'Habilitando…',
      error: 'Ocurrió un error al habilitar el usuario.',
    },
    disable: {
      title: 'Deshabilitar usuario',
      message: '¿Confirmás que querés deshabilitar a {{name}}? Va a perder el acceso a la plataforma.',
      confirm: 'Deshabilitar',
      confirming: 'Deshabilitando…',
      error: 'Ocurrió un error al deshabilitar el usuario.',
    },
  },
} as const

export default users
