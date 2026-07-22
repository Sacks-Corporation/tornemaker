import type { ReactNode } from 'react'

export interface ChartCardProps {
  title: string
  description?: string
  /** Alto del área del gráfico (clase de Tailwind, default `h-72`). */
  heightClassName?: string
  children: ReactNode
  className?: string
}

// Superficie estándar para gráficos de Recharts: título + descripción opcional
// y un área de alto fijo. Los hijos deben usar <ResponsiveContainer> para
// llenar el área, y tomar los colores de CHART_COLORS (utils/chart.utils.ts).
function ChartCard({
  title,
  description,
  heightClassName = 'h-72',
  children,
  className = '',
}: ChartCardProps) {
  return (
    <section
      className={[
        'flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5',
        className,
      ].join(' ')}
    >
      <header className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </header>
      <div className={['w-full', heightClassName].join(' ')}>{children}</div>
    </section>
  )
}

export default ChartCard
