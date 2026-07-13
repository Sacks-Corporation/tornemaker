const common = {
  siteName: 'Tornemaker',
  header: {
    toggleThemeToLight: 'Cambiar a modo claro',
    toggleThemeToDark: 'Cambiar a modo oscuro',
  },
  footer: {
    text: 'Tornemaker — La plataforma para organizar y gestionar torneos.',
    rights: 'Sacks Corporation. Todos los derechos reservados.',
  },
  datePicker: {
    placeholder: 'Seleccioná una fecha',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    months: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ],
    weekdaysShort: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  },
  modal: {
    close: 'Cerrar',
  },
  snackbar: {
    close: 'Cerrar',
  },
} as const

export default common
