// Utilidades de formateo de fechas del backoffice.

const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}

// Formatea un ISO string (tal como llegan `updatedAt`/`lastSignedIn` desde el
// backend) a fecha + hora local (es-AR). Devuelve '—' si el valor es inválido.
export const formatDateTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-AR', DATE_TIME_FORMAT_OPTIONS)
}

// Formatea un ISO string a solo fecha local (es-AR), sin hora. Devuelve '—' si
// el valor es inválido.
export const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-AR', DATE_FORMAT_OPTIONS)
}
