// Colores para las series de Recharts. Son CSS vars del tema (definidas en
// index.css para light y dark), así los gráficos se adaptan solos al modo
// activo sin re-render. Usá siempre esta paleta en vez de hex hardcodeado.
export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
] as const

export const getChartColor = (index: number): string =>
  CHART_COLORS[index % CHART_COLORS.length]
