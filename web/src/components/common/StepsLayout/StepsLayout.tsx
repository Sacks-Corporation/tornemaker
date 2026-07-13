import type { ReactNode } from 'react'
import Button from '../Button'

export interface StepsLayoutProps {
  currentStep: number
  totalSteps: number
  title: string
  stepIndicatorLabel: string
  backLabel: string
  nextLabel: string
  onBack?: () => void
  onNext: () => void
  backDisabled?: boolean
  nextDisabled?: boolean
  isNextLoading?: boolean
  children: ReactNode
}

// Layout compartido por todos los steps del wizard de creación de torneo:
// indicador de progreso, slot de contenido y botones de navegación Atrás/Siguiente.
function StepsLayout({
  currentStep,
  totalSteps,
  title,
  stepIndicatorLabel,
  backLabel,
  nextLabel,
  onBack,
  onNext,
  backDisabled = false,
  nextDisabled = false,
  isNextLoading = false,
  children,
}: StepsLayoutProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {stepIndicatorLabel}
        </span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h2 className="text-xl font-semibold text-text sm:text-2xl">{title}</h2>
      </div>

      <div className="flex flex-col gap-4">{children}</div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={backDisabled || !onBack}
        >
          {backLabel}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={nextDisabled || isNextLoading}
          isLoading={isNextLoading}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}

export default StepsLayout
