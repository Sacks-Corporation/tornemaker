const tournaments = {
  title: 'Torneos',
  subtitle: 'Listado de torneos creados en Tornemaker.',
  columns: {
    name: 'Nombre',
    format: 'Tipo',
    teamCount: 'Equipos',
    consoleCount: 'Consolas',
    status: 'Estado',
    state: 'Etapa',
    createdAt: 'Creación',
    updatedAt: 'Fecha de actualización',
  },
  formats: {
    SINGLE_ELIMINATION: 'Eliminación directa',
    GROUP_STAGE_PLUS_ELIMINATION: 'Grupos + Eliminación',
    LEAGUE: 'Liga',
    SWISS_PLUS_ELIMINATION: 'Suizo + Eliminación',
  },
  statuses: {
    EN_PROGRESO: 'En progreso',
    TERMINADO: 'Terminado',
  },
  states: {
    LEAGUE: 'Liga',
    GROUPS: 'Fase de grupos',
    SWISS: 'Suizo',
    KNOCKOUTS: 'Eliminatorias',
    FINISHED: 'Finalizado',
    DELETED: 'Eliminado',
  },
} as const

export default tournaments
