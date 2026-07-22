const common = {
  siteName: 'Tornemaker',
  appName: 'Backoffice',
  sidebar: {
    navLabel: 'Navegación principal',
    dashboard: 'Dashboard',
    toggleThemeToLight: 'Cambiar a modo claro',
    toggleThemeToDark: 'Cambiar a modo oscuro',
  },
  footer: {
    copyright: '© {{year}} · Sacks Corporation. Todos los derechos reservados.',
  },
  table: {
    actions: 'Acciones',
    empty: 'No hay datos para mostrar.',
    error: 'Ocurrió un error al cargar los datos.',
    loading: 'Cargando…',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    pageOf: 'Página {{page}} de {{total}}',
    sortBy: 'Ordenar por {{column}}',
  },
  modal: {
    close: 'Cerrar',
  },
  loading: {
    label: 'Cargando…',
  },
} as const

export default common
