// Utilidades para el manejo de fechas y calendarios (usadas por DatePicker)

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
}

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1)

export const addMonths = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1)

// Genera la grilla de días (6 semanas x 7 días) para el mes de la fecha dada,
// completando con días del mes anterior/siguiente para llenar la grilla.
export const getCalendarDays = (monthDate: Date): CalendarDay[] => {
  const firstDayOfMonth = startOfMonth(monthDate)
  const firstWeekday = firstDayOfMonth.getDay()
  const gridStart = new Date(firstDayOfMonth)
  gridStart.setDate(gridStart.getDate() - firstWeekday)

  const days: CalendarDay[] = []
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + i)
    days.push({ date: day, isCurrentMonth: day.getMonth() === monthDate.getMonth() })
  }

  return days
}

export const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
